import crypto from 'node:crypto';

const fail=(res,status,message)=>res.status(status).json({ok:false,error:message});
const redisUrl=()=>process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
const redisToken=()=>process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
const ready=()=>Boolean(redisUrl()&&redisToken()&&process.env.PFA_ADMIN_PASSWORD&&process.env.PFA_SESSION_SECRET);
async function redis(command){
  const response=await fetch(redisUrl(),{
    method:'POST',headers:{Authorization:'Bearer '+redisToken(),'Content-Type':'application/json'},
    body:JSON.stringify(command)
  });
  if(!response.ok)throw new Error('Banco de dados indisponível');
  const json=await response.json();
  if(json.error)throw new Error('Falha no banco de dados');
  return json.result;
}
const cookieName='pfa_admin_session';
const sign=(payload)=>crypto.createHmac('sha256',process.env.PFA_SESSION_SECRET).update(payload).digest('base64url');
function authenticated(req){
  const raw=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='));
  if(!raw)return false;
  const [payload,sig]=(raw.split('=')[1]||'').split('.');
  if(!payload||!sig)return false;
  const expected=sign(payload);
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;
  try{const decoded=JSON.parse(Buffer.from(payload,'base64url').toString());return decoded.role==='admin'&&Date.now()<decoded.exp}catch{return false}
}
function sessionCookie(value,maxAge){return cookieName+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+maxAge}
function sameOrigin(req){
  const origin=req.headers.origin;
  if(!origin)return true;
  const host=req.headers['x-forwarded-host']||req.headers.host;
  try{return new URL(origin).host===host&&new URL(origin).protocol==='https:'}catch{return false}
}
function fingerprint(req){
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'anon').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0,20);
}
async function limit(prefix,id,maximum){
  const key='pfa:limit:'+prefix+':'+id;
  const n=Number(await redis(['INCR',key]));
  if(n===1)await redis(['EXPIRE',key,3600]);
  return n<=maximum;
}
function passwordMatches(input){
 const actual=Buffer.from(String(process.env.PFA_ADMIN_PASSWORD||''));const candidate=Buffer.from(input||'');
 return candidate.length===actual.length&&crypto.timingSafeEqual(candidate,actual);
}
function bodyFrom(req){return typeof req.body==='string'?JSON.parse(req.body):req.body||{}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!ready())return fail(res,503,'Cadastros indisponíveis: configuração segura pendente.');
 const action=String(req.query.action||'');
 if(req.method==='GET'&&action==='status')return res.status(200).json({ok:true,enabled:true});
 if(req.method==='GET'&&action==='me')return res.status(200).json({ok:true,admin:authenticated(req)});
 if(req.method!=='POST'&&!(req.method==='GET'&&action==='students'))return fail(res,405,'Operação não permitida');
 if(req.method==='POST'&&!sameOrigin(req))return fail(res,403,'Origem não autorizada');
 try{
  if(action==='login'){
   if(!await limit('login',fingerprint(req),8))return fail(res,429,'Muitas tentativas. Tente novamente mais tarde.');
   const {password}=bodyFrom(req);
   if(typeof password!=='string'||!passwordMatches(password))return fail(res,401,'Senha incorreta');
   const payload=Buffer.from(JSON.stringify({role:'admin',exp:Date.now()+12*3600000})).toString('base64url');
   res.setHeader('Set-Cookie',sessionCookie(payload+'.'+sign(payload),12*3600));
   return res.status(200).json({ok:true});
  }
  if(action==='logout'){
   res.setHeader('Set-Cookie',sessionCookie('',0));return res.status(200).json({ok:true});
  }
  if(action==='signup'){
   if(!await limit('signup',fingerprint(req),30))return fail(res,429,'Limite de tentativas alcançado');
   const b=bodyFrom(req);
   const name=String(b.name||'').trim(),phone=String(b.phone||'').trim(),email=String(b.email||'').trim().toLowerCase();
   if(name.length<2||name.length>100||!/^\+?[0-9 ()-]{8,22}$/.test(phone)||email.length>160||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail(res,400,'Confira nome, WhatsApp e e-mail');
   if(typeof b.consent!=='boolean')return fail(res,400,'Consentimento inválido');
   const id=crypto.createHmac('sha256',process.env.PFA_SESSION_SECRET).update(email).digest('hex');
   const existing=await redis(['GET','pfa:student:'+id]);
   const createdAt=existing?JSON.parse(existing).createdAt:new Date().toISOString();
   const record={id,name,phone,email,consent:b.consent,createdAt,updatedAt:new Date().toISOString()};
   await redis(['SET','pfa:student:'+id,JSON.stringify(record)]);
   await redis(['ZADD','pfa:students',Date.now(),id]);
   return res.status(200).json({ok:true,message:'Inscrição recebida'});
  }
  if(!authenticated(req))return fail(res,401,'Acesso exclusivo do administrador');
  if(req.method==='GET'&&action==='students'){
   const ids=await redis(['ZREVRANGE','pfa:students',0,499]);
   if(!ids?.length)return res.status(200).json({ok:true,students:[]});
   const values=await redis(['MGET',...ids.map(id=>'pfa:student:'+id)]);
   return res.status(200).json({ok:true,students:values.filter(Boolean).map(v=>JSON.parse(v))});
  }
  if(action==='delete'){
   const {id}=bodyFrom(req);
   if(typeof id!=='string'||!/^[a-f0-9]{64}$/.test(id))return fail(res,400,'Registro inválido');
   await redis(['DEL','pfa:student:'+id]);await redis(['ZREM','pfa:students',id]);
   return res.status(200).json({ok:true});
  }
  return fail(res,404,'Operação não encontrada');
 }catch(e){return fail(res,500,'Não foi possível concluir a operação. Tente novamente.')}
}
