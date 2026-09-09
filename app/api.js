(() => {
  const cfg = window.REPAIRLOAN_CONFIG;
  const k = 'repairloan_v2_session';
  const getSession = () => { try { return JSON.parse(sessionStorage.getItem(k)||'null') } catch { return null } };
  const setSession = (s) => sessionStorage.setItem(k, JSON.stringify(s));
  const clearSession = () => sessionStorage.removeItem(k);
  async function call(name, body={}, opts={}) {
    const s = getSession();
    const headers = {'Content-Type':'application/json','apikey':cfg.supabasePublishableKey};
    if (s?.token) headers['x-repairloan-session'] = s.token;
    const r = await fetch(`${cfg.functionsBaseUrl}/${name}`, {method:'POST', headers, body:JSON.stringify(body)});
    const j = await r.json().catch(()=>({ok:false,error:'BAD_RESPONSE'}));
    if(!r.ok || j.ok===false) throw new Error(j.message || j.error || `HTTP_${r.status}`);
    return j;
  }
  window.RepairLoanAPI = {call,getSession,setSession,clearSession};
})();
