function stamp(){
  return new Date().toISOString();
}

function info(message, extra){
  if(extra){
    console.log(`[${stamp()}] INFO ${message}`, extra);
    return;
  }
  console.log(`[${stamp()}] INFO ${message}`);
}

function warn(message, extra){
  if(extra){
    console.warn(`[${stamp()}] WARN ${message}`, extra);
    return;
  }
  console.warn(`[${stamp()}] WARN ${message}`);
}

function error(message, err){
  if(err){
    console.error(`[${stamp()}] ERROR ${message}`, err);
    return;
  }
  console.error(`[${stamp()}] ERROR ${message}`);
}

module.exports = { info, warn, error };
