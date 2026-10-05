'use strict';
const types=[['blend','Blend · 혼색'],['running','Running color · 번짐'],['smear','Smear · 색 끌기']];
const descriptions={blend:'지나온 색을 붓에 머금어 다음 색과 계속 섞습니다. 바탕의 투명도도 반영합니다.',running:'현재 붓이 지나가는 위치의 색과 그리기 색을 섞습니다. 색 늘이기로 시작 색이 유지되는 거리를 조절합니다.',smear:'지나온 색을 끌어 이어 칠합니다. 바탕의 투명도 대신 브러시 불투명도로 농도를 유지합니다.'};
function mix(s,q,picked,point){const paint=[1,3,5].map(i=>parseInt(s.color.slice(i,i+2),16)),amount=s.paintAmount??.5,carry=s.colorStretch??.5;
 if(s.mixType==='running'){if(q.mixPoint)q.mixDistance=(q.mixDistance||0)+Math.hypot(point[0]-q.mixPoint[0],point[1]-q.mixPoint[1]);q.mixPoint=point.slice(0,2);const ratio=amount+(1-amount)*carry*Math.exp(-(q.mixDistance||0)/Math.max(1,s.size*(1+carry*8)));q.color=picked[3]>0?paint.map((v,i)=>v*ratio+picked[i]*(1-ratio)):paint;q.pigment=amount+(1-amount)*picked[3]/255;}
 else{const pigment=amount+(1-amount)*Math.max(picked[3]/255,(q.pigment||0)*carry);if(!pigment)return{color:paint,pigment:0};const local=picked[3]>0?paint.map((v,i)=>v*amount+picked[i]*(1-amount)):(q.color||paint);q.color=q.color?local.map((v,i)=>q.color[i]*carry+v*(1-carry)):local;q.pigment=pigment;}
 return{color:q.color,pigment:s.mixType==='smear'?1:q.pigment};
}
module.exports={types,descriptions,mix};
