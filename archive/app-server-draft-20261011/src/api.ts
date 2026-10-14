export async function api<T=any>(path:string, method='GET', body?:unknown):Promise<T>{
  const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  let data:any;try{data=await response.json();}catch{throw new Error('The connection paused. Your saved list is still there.');}
  if(!response.ok)throw new Error(data.error||'Please try again.');
  return data;
}
