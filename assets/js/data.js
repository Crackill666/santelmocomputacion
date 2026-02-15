(function(){
  async function loadProducts(){
    const res = await fetch("./assets/data/products.json", { cache:"no-store" });
    if(!res.ok) throw new Error("No se pudo cargar products.json");
    return await res.json();
  }

  function groupBy(arr, key){
    const out = new Map();
    for(const item of arr){
      const k = item[key];
      if(!out.has(k)) out.set(k, []);
      out.get(k).push(item);
    }
    return out;
  }

  window.StoreData = { loadProducts, groupBy };
})();
