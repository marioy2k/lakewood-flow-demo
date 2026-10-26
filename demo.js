'use strict';
// Standalone preview adapter. No requests reach the operational application's API.
(()=>{
const key='lakewood-flow-demo-v1';
const seed={
 logs:[{id:1,code:'ST-2026-041',species:'Basralocus',origin:'Stuwmeer · vak Noord',location:'Stammenwerf A',volume:8.4,remaining:5.4},{id:2,code:'ST-2026-042',species:'Kopi',origin:'Stuwmeer · vak Oost',location:'Stammenwerf B',volume:6.2,remaining:6.2},{id:3,code:'ST-2026-043',species:'Wana',origin:'Stuwmeer · vak Noord',location:'Stammenwerf A',volume:4.8,remaining:4.8}],
 products:[{id:1,code:'PL-BAS-25100',name:'Planken Basralocus',species:'Basralocus',dimensions:'25 × 100 × 3000 mm',unit:'stuk',stock:240},{id:2,code:'REST-BAS',name:'Resthout Basralocus',species:'Basralocus',dimensions:'Gemengd resthout',unit:'m3',stock:0.75},{id:3,code:'PL-KOP-50150',name:'Balken Kopi',species:'Kopi',dimensions:'50 × 150 × 3000 mm',unit:'stuk',stock:0}],
 parts:[{id:1,code:'OF-001',name:'Oliefilter generator',unit:'stuk',minimum:3,stock:2},{id:2,code:'ZR-005',name:'Zaaglint 5 m',unit:'stuk',minimum:2,stock:6},{id:3,code:'OL-15W40',name:'Motorolie 15W-40',unit:'liter',minimum:40,stock:120}],
 machines:[{id:1,code:'GEN-01',name:'Generator 01 · hoofdvoorziening',hours:4250,service_at:4280,last_reading:null},{id:2,code:'ZAAG-01',name:'Hoofdzaag 01',hours:1536,service_at:1500,last_reading:null},{id:3,code:'GEN-02',name:'Generator 02 · reserve',hours:1820,service_at:2000,last_reading:null}],
 tanks:[{id:1,code:'DSL-01',name:'Centrale dieseltank',capacity:10000,minimum:2000,stock:4650,measured:4620,measured_at:'2026-10-26T08:00:00-03:00'},{id:2,code:'DSL-02',name:'Dagtank generatoren',capacity:1000,minimum:200,stock:150,measured:null,measured_at:null}],
 workorders:[{id:1,machine_id:2,title:'Zaaglint uitlijnen en geleiders controleren',priority:'hoog',description:'Trillingen tijdens het zagen.',status:'open',created_at:'2026-10-26T10:00:00-03:00'},{id:2,machine_id:1,title:'Onderhoud voorbereiden · olie en filters',priority:'normaal',description:'Onderdelen klaarzetten voor volgend onderhoud.',status:'in_progress',created_at:'2026-10-26T09:00:00-03:00'}],
 production:[{id:1,log_id:1,product_id:1,machine_id:2,input_volume:3,output_volume:1.8,quantity:240,waste_product_id:2,waste_volume:.75,loss_volume:.45,user_id:1,created_at:'2026-10-26T11:00:00-03:00'}],
 movements:[{id:1,kind:'tanks',item_id:1,delta:5000,reason:'Voorbeeldlevering diesel',machine_id:null,workorder_id:null,user_id:1,created_at:'2026-10-25T08:00:00-03:00'},{id:2,kind:'tanks',item_id:1,delta:-350,reason:'Voorbeelduitgifte generator',machine_id:1,workorder_id:null,user_id:1,created_at:'2026-10-26T07:00:00-03:00'}],
 finance:[{id:1,direction:'income',category:'Houtverkoop',description:'Voorbeeldbetaling planken',amount:3250,currency:'USD',created_at:'2026-10-26T12:00:00-03:00'},{id:2,direction:'expense',category:'Diesel',description:'Voorbeeldlevering brandstof',amount:1850,currency:'USD',created_at:'2026-10-25T08:00:00-03:00'},{id:3,direction:'expense',category:'Transport',description:'Voorbeeldtransport stammen',amount:12500,currency:'SRD',created_at:'2026-10-26T09:00:00-03:00'}],
 audit:[{id:1,user_id:1,action:'demo:initialisatie',detail:'Uitsluitend fictieve voorbeeldgegevens',created_at:new Date().toISOString()}],users:[{id:1,username:'Demo beheerder',role:'admin'}]
};
let db;try{db=JSON.parse(localStorage.getItem(key))||structuredClone(seed)}catch{db=structuredClone(seed)}
let signedIn=true;
const save=()=>localStorage.setItem(key,JSON.stringify(db));
const get=(table,id)=>{let r=db[table]?.find(r=>r.id===Number(id));if(!r)throw Error('Selecteer een geldig record.');return r};
const n=(d,k,positive=false)=>{let v=Number(d[k]);if(!Number.isFinite(v)||v<0||(positive&&v===0))throw Error('Ongeldige waarde: '+k);return v};
const add=(t,d)=>{let r={...d,id:Math.max(0,...db[t].map(r=>r.id))+1};db[t].unshift(r);return r};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const original=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
const path=String(input);if(!path.startsWith('/api/'))return original(input,options);
const route=path.slice(5),body=options.body?JSON.parse(options.body):null;
try{
if(route==='login'){signedIn=true;return response({user:db.users[0],csrf:'demo-only'})}
if(route==='logout'){signedIn=false;return response({ok:true})}
if(!signedIn)return response({error:'Open de demo opnieuw of gebruik de demo-login.'},401);
if(route==='me')return response({user:db.users[0],csrf:'demo-only'});
if(route==='data')return response(db);
if(!body)throw Error('Niet beschikbaar in deze demo.');
const before=structuredClone(db);
try{
if(route==='production'){
const l=get('logs',body.log_id),p=get('products',body.product_id);get('machines',body.machine_id);
const input=n(body,'input_volume',true),output=n(body,'output_volume',true),qty=n(body,'quantity',true),waste=n(body,'waste_volume');
if(input>l.remaining||output+waste>input)throw Error('Volume overschrijdt de beschikbare invoer.');
if(p.species!==l.species)throw Error('Houtsoorten verschillen.');
if(p.unit==='m3'&&Math.abs(qty-output)>1e-8)throw Error('Aantal moet gelijk zijn aan het uitvoervolume in m³.');
if(waste){let w=get('products',body.waste_product_id);if(w.id===p.id||w.unit!=='m3'||w.species!==l.species)throw Error('Kies passend restmateriaal in m3.');w.stock+=waste}
l.remaining-=input;p.stock+=qty;add('production',{...body,log_id:l.id,product_id:p.id,machine_id:Number(body.machine_id),input_volume:input,output_volume:output,quantity:qty,waste_volume:waste,loss_volume:input-output-waste,created_at:new Date().toISOString()});
}else if(route==='movements'){
if(!['parts','products','tanks'].includes(body.kind))throw Error('Ongeldige voorraadsoort.');
let item=get(body.kind,body.item_id),quantity=n(body,'quantity',true),delta=body.direction==='in'?quantity:-quantity;
if(item.stock+delta<0)throw Error('Onvoldoende voorraad.');if(body.kind==='tanks'&&item.stock+delta>item.capacity)throw Error('Tankcapaciteit wordt overschreden.');
item.stock+=delta;add('movements',{...body,item_id:item.id,delta,machine_id:body.machine_id?Number(body.machine_id):null,created_at:new Date().toISOString()});
}else if(route==='machine-reading'){
let m=get('machines',body.id),hours=n(body,'hours');if(hours<m.hours)throw Error('Draaiuren mogen niet afnemen.');m.hours=hours;m.service_at=n(body,'service_at');
}else if(route==='workorder-status')get('workorders',body.id).status=body.status;
else if(db[route]&&route!=='users'){
let record={...body};for(const k of ['volume','minimum','hours','service_at','capacity','amount'])if(k in record)record[k]=n(record,k,['volume','capacity','amount'].includes(k));
if(record.code&&db[route].some(r=>r.code===record.code))throw Error('Deze code bestaat al.');
if(route==='logs')record.remaining=record.volume;
if(['products','parts','tanks'].includes(route))record.stock=0;
if(route==='tanks'){if(record.minimum>record.capacity)throw Error('Minimum overschrijdt de capaciteit.');record.measured=null;record.measured_at=null}
if(route==='workorders'){get('machines',body.machine_id);record.machine_id=Number(body.machine_id);record.status='open'}
record.created_at=new Date().toISOString();add(route,record);
}else throw Error('Gebruikers en echte koppelingen worden in de serverversie beheerd.');
add('audit',{user_id:1,action:'demo:'+route,detail:'Voorbeeldregistratie',created_at:new Date().toISOString()});save();return response({ok:true});
}catch(e){db=before;throw e}
}catch(e){return response({error:e.message},400)}
};
document.addEventListener('DOMContentLoaded',()=>{let banner=document.createElement('div');banner.className='demo-banner';let text=document.createElement('span');text.textContent='WEBDEMO · Fictieve gegevens · Wijzigingen alleen in deze browser';let reset=document.createElement('button');reset.textContent='Demo herstellen';reset.onclick=()=>{localStorage.removeItem(key);location.reload()};banner.append(text,reset);document.body.prepend(banner)});
})();
