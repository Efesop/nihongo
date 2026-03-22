export function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

export function daysUntil(dateStr){if(!dateStr)return 0;return Math.max(0,Math.ceil((new Date(dateStr)-Date.now())/(864e5)));}
