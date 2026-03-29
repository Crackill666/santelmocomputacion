(function(){
  function qs(sel){ return document.querySelector(sel); }

  var out = qs("#output");

  function setOutput(data){
    if(!out) return;
    if(typeof data === "string"){
      out.textContent = data;
      return;
    }
    out.textContent = JSON.stringify(data, null, 2);
  }

  async function callApi(url, options){
    var res = await fetch(url, options || {});
    var data = await res.json().catch(function(){ return { ok: false, error: "Respuesta no JSON" }; });
    return { status: res.status, data: data };
  }

  async function onAuthCheck(){
    setOutput("Consultando auth-check...");
    try{
      var result = await callApi("/api/shipping/correo/auth-check");
      setOutput(result);
    }catch(err){
      setOutput({ ok: false, error: err && err.message ? err.message : "Error de red" });
    }
  }

  async function onAgencies(){
    var provinceCode = qs("#provinceCode") && qs("#provinceCode").value || "";
    var postalCode = qs("#postalCode") && qs("#postalCode").value || "";
    var locality = qs("#locality") && qs("#locality").value || "";

    var params = new URLSearchParams();
    if(provinceCode) params.set("provinceCode", provinceCode);
    if(postalCode) params.set("postalCode", postalCode);
    if(locality) params.set("locality", locality);

    var url = "/api/shipping/correo/agencies" + (params.toString() ? ("?" + params.toString()) : "");

    setOutput("Consultando sucursales...");
    try{
      var result = await callApi(url);
      setOutput(result);
    }catch(err){
      setOutput({ ok: false, error: err && err.message ? err.message : "Error de red" });
    }
  }

  var authCheckBtn = qs("#authCheckBtn");
  var agenciesBtn = qs("#agenciesBtn");

  if(authCheckBtn){
    authCheckBtn.addEventListener("click", onAuthCheck);
  }

  if(agenciesBtn){
    agenciesBtn.addEventListener("click", onAgencies);
  }
})();