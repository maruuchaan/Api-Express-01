function log (req,res,next){
    console.log('Conectando...');
    next();
};

module.exports = log; //para exportar el módulo al archivo principal app.js