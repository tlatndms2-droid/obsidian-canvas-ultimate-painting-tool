const { Plugin } = require('obsidian');

module.exports = class CanvasDrawingIntegrationPoc extends Plugin {
  async onload() {
    this.mode = 'select';
    this.strokes = [];
    this.strokeBounds = [];
    this.active = null;
    this.host = null;
    this.filePath = null;
    this.loadSerial = 0;
    this.deletedPaths = new Set();
    this.spaceHeld = false;
    this.saveTimer = null;
    this.onKeyDown = (event) => { if (event.code === 'Space') this.spaceHeld = true; };
    this.onKeyUp = (event) => { if (event.code === 'Space') this.spaceHeld = false; };
    this.registerDomEvent(window, 'keydown', this.onKeyDown, true);
    this.registerDomEvent(window, 'keyup', this.onKeyUp, true);
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.sync()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.sync()));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onCanvasDeleted(file).catch(console.error)));
    this.registerEvent(this.app.vault.on('create', (file) => this.onCanvasCreated(file).catch(console.error)));
    this.registerInterval(window.setInterval(() => this.sync(), 500));
    this.sync();
  }

  onunload() {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.save().catch(console.error);
    this.detach();
  }

  async sync() {
    const leaf = this.app.workspace.activeLeaf;
    const view = leaf?.view;
    const file = view?.file;
    const wrapper = view?.containerEl?.querySelector('.canvas-wrapper');
    const canvas = wrapper?.querySelector('.canvas');
    if (view?.getViewType?.() !== 'canvas' || !file || !wrapper || !canvas) {
      if (this.host) this.detach();
      return;
    }
    if (this.deletedPaths.has(file.path)) return;
    if (this.host === wrapper && this.canvas === canvas && this.filePath === file.path) return;
    await this.save();
    this.detach();
    this.host = wrapper;
    this.canvas = canvas;
    this.filePath = file.path;
    this.mode = 'select';
    this.strokes = [];
    this.strokeBounds = [];
    this.attach();
    await this.loadStrokes(file.path);
  }

  attach() {
    const controls = document.createElement('div');
    controls.className = 'canvas-drawing-poc-controls';
    controls.setAttribute('aria-label', 'Canvas drawing PoC tools');
    const selectButton = document.createElement('button');
    selectButton.textContent = '선택';
    const drawButton = document.createElement('button');
    drawButton.textContent = '그리기';
    controls.append(selectButton, drawButton);
    this.host.append(controls);
    this.controls = controls;
    this.selectButton = selectButton;
    this.drawButton = drawButton;
    selectButton.addEventListener('click', () => this.setMode('select'));
    drawButton.addEventListener('click', () => this.setMode('draw'));
    this.setMode('select');

    const raster = document.createElement('canvas');
    raster.className = 'canvas-drawing-poc-raster';
    raster.setAttribute('aria-label', '시험 그림');
    this.host.append(raster);
    this.raster = raster;
    this.transformObserver = new MutationObserver(() => {
      if (this.renderPending) return;
      this.renderPending = true;
      requestAnimationFrame(() => { this.renderPending = false; this.render(); });
    });
    this.transformObserver.observe(this.canvas, { attributes: true, attributeFilter: ['style'] });
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.host);

    this.pointerDown = (event) => this.handlePointerDown(event);
    this.pointerMove = (event) => this.handlePointerMove(event);
    this.pointerUp = (event) => this.handlePointerUp(event);
    this.host.addEventListener('pointerdown', this.pointerDown, true);
    window.addEventListener('pointermove', this.pointerMove, true);
    window.addEventListener('pointerup', this.pointerUp, true);
    window.addEventListener('pointercancel', this.pointerUp, true);
  }

  detach() {
    if (this.host) this.host.removeEventListener('pointerdown', this.pointerDown, true);
    if (this.pointerMove) window.removeEventListener('pointermove', this.pointerMove, true);
    if (this.pointerUp) {
      window.removeEventListener('pointerup', this.pointerUp, true);
      window.removeEventListener('pointercancel', this.pointerUp, true);
    }
    this.controls?.remove();
    this.raster?.remove();
    this.transformObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.transformObserver = null;
    this.resizeObserver = null;
    this.controls = this.raster = this.host = this.canvas = null;
    this.active = null;
  }

  setMode(mode) {
    this.mode = mode;
    this.selectButton?.classList.toggle('is-active', mode === 'select');
    this.drawButton?.classList.toggle('is-active', mode === 'draw');
    if (this.host) this.host.style.cursor = mode === 'draw' ? 'crosshair' : '';
  }

  toCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width / this.canvas.offsetWidth;
    const sy = rect.height / this.canvas.offsetHeight;
    return [Math.round((event.clientX - rect.left) / sx * 100) / 100, Math.round((event.clientY - rect.top) / sy * 100) / 100];
  }

  handlePointerDown(event) {
    if (this.mode !== 'draw' || this.spaceHeld || event.button !== 0 || event.target.closest('.canvas-drawing-poc-controls, .canvas-controls, .canvas-card-menu, .view-header')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active = { pointerId: event.pointerId, points: [this.toCanvasPoint(event)] };
    this.strokes.push(this.active.points);
    this.strokeBounds.push(this.getBounds(this.active.points));
    this.render();
  }

  handlePointerMove(event) {
    if (!this.active || event.pointerId !== this.active.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active.points.push(this.toCanvasPoint(event));
    this.strokeBounds[this.strokeBounds.length - 1] = this.getBounds(this.active.points);
    this.render();
  }

  handlePointerUp(event) {
    if (!this.active || event.pointerId !== this.active.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active.points.push(this.toCanvasPoint(event));
    this.strokeBounds[this.strokeBounds.length - 1] = this.getBounds(this.active.points);
    this.active = null;
    this.queueSave();
    this.render();
  }

  render() {
    if (!this.raster) return;
    const canvasRect = this.canvas.getBoundingClientRect();
    const hostRect = this.host.getBoundingClientRect();
    const scale = canvasRect.width / this.canvas.offsetWidth;
    if (!Number.isFinite(scale) || scale <= 0 || !hostRect.width || !hostRect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(hostRect.width * dpr);
    const height = Math.ceil(hostRect.height * dpr);
    if (this.raster.width !== width || this.raster.height !== height) {
      this.raster.width = width;
      this.raster.height = height;
    }
    const context = this.raster.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.setTransform(scale * dpr, 0, 0, scale * dpr, (canvasRect.left - hostRect.left) * dpr, (canvasRect.top - hostRect.top) * dpr);
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#dd3c84';
    const margin = 100 / scale;
    const visible = {
      left: (hostRect.left - canvasRect.left) / scale - margin,
      top: (hostRect.top - canvasRect.top) / scale - margin,
      right: (hostRect.right - canvasRect.left) / scale + margin,
      bottom: (hostRect.bottom - canvasRect.top) / scale + margin,
    };
    let rendered = 0;
    for (let index = 0; index < this.strokes.length; index++) {
      const points = this.strokes[index];
      if (!points.length) continue;
      const bounds = this.strokeBounds[index] || this.getBounds(points);
      if (bounds.right < visible.left || bounds.left > visible.right || bounds.bottom < visible.top || bounds.top > visible.bottom) continue;
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      for (let j = 1; j < points.length; j++) context.lineTo(points[j][0], points[j][1]);
      context.stroke();
      rendered++;
    }
    this.renderedStrokeCount = rendered;
  }

  getBounds(points) {
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  dataPath(path) { return `${path}.drawing-poc.json`; }

  async onCanvasDeleted(file) {
    if (!file.path.endsWith('.canvas')) return;
    const path = file.path;
    this.deletedPaths.add(path);
    if (this.filePath === path) {
      if (this.saveTimer) window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      await this.save();
      this.detach();
      this.filePath = null;
    }
    const dataPath = this.dataPath(path);
    if (!await this.app.vault.adapter.exists(dataPath)) return;
    const trashedCanvas = `.trash/${path}`;
    for (let attempt = 0; attempt < 10 && !await this.app.vault.adapter.exists(trashedCanvas); attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
    if (!await this.app.vault.adapter.exists(trashedCanvas)) return;
    const trashedData = `.trash/${dataPath}`;
    if (await this.app.vault.adapter.exists(trashedData)) throw new Error(`PoC trash companion collision: ${trashedData}`);
    await this.app.vault.adapter.rename(dataPath, trashedData);
  }

  async onCanvasCreated(file) {
    if (!file.path.endsWith('.canvas')) return;
    const path = file.path;
    const dataPath = this.dataPath(path);
    const trashedData = `.trash/${dataPath}`;
    if (await this.app.vault.adapter.exists(trashedData) && !await this.app.vault.adapter.exists(dataPath)) {
      await this.app.vault.adapter.rename(trashedData, dataPath);
    }
    this.deletedPaths.delete(path);
    this.sync();
  }

  async loadStrokes(path) {
    const serial = ++this.loadSerial;
    try {
      const dataPath = this.dataPath(path);
      if (!await this.app.vault.adapter.exists(dataPath)) return;
      const parsed = JSON.parse(await this.app.vault.adapter.read(dataPath));
      if (serial === this.loadSerial && this.filePath === path && Array.isArray(parsed.strokes)) {
        this.strokes = parsed.strokes;
        this.strokeBounds = this.strokes.map(points => this.getBounds(points));
        this.render();
      }
    } catch (error) { console.error('Canvas drawing PoC load failed', error); }
  }

  queueSave() {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => { this.saveTimer = null; this.save().catch(console.error); }, 300);
  }

  async save() {
    if (!this.filePath || !this.strokes.length) return;
    const path = this.dataPath(this.filePath);
    await this.app.vault.adapter.write(path, JSON.stringify({ version: 1, strokes: this.strokes }));
  }
};
