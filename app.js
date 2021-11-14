
const inicioDebug = require('debug')('app:inicio'); //app:inicio sería como el entorno de depuración para la aplicación al momento de iniciarla, SE CREA por consola export DEBUG=app:inicio
const dbDebug = require('debug')('app:db');//entorno para depurar la bbdd cuando inicia la aplicación
const express = require('express'); //iniciamos el requerimiento para trabajar con express en node
const config = require('config'); 
//const logger = require('./logger');//exporté el archivo logger, como era de ejemplo y después se usa morgan, se comenta y ya no se usa
const morgan = require('morgan');
const Joi = require('@hapi/joi'); //para realizar validaciones de esquemas (npm.com/joi)
const app = express(); //se crea una instancia de express llamada app que puede recibir valores

//Uso de middlewares
app.use(express.json());//express.json es un middleware que permite traer el body de una petición del usuario en formato json
app.use(express.urlencoded({extended:true}));// la propiedad extended es para trabajr querystrings
app.use(express.static('public')); //middleware para acceder a recursos estáticos, carpeta "public"

//Configuración de entornos
console.log('La aplicación ' + config.get('nombre'));
console.log('BD server: ' + config.get('configDB.host'));

//Uso de morgan (se usa en entonrno de desarrollo, por eso se hace el if)
if(app.get('env') === 'development'){
    app.use(morgan('tiny'));//tiny es el formato por defecto (ver documentación)
    inicioDebug('Morgan está habilitado.')
    //console.log('Morgan habilitado...') en vez de este msj usaremos el const inicioDebug
//Trabajo con BBDD (Debug)
    dbDebug('Conectando con la BBDD...');   

};




//creando middlewares personalizados
// app.use(function(req,res,next){
//     console.log('Conectando...');
//     next(); //variable next es para terminar el proceso de llamada de la función
// });

//app.use(logger); mismo comentario del require logger

//autenticación
app.use(function(req,res,next){
    console.log('Autenticando...');
    next();
})

const usuarios = [ //esta variable es para manejar data en una operación get con https
    {id:1, nombre: 'Ricardo'},
    {id:2, nombre: 'Daiki'},
    {id:3, nombre: 'Airi'}
];
//Métodos
// app.get('/',(req,res) => { //método get recibe una ruta, un callback con (request y response)
//     res.send('Hola Mundo desde Express');
// }); 
// app.post(); //envío de datos hacia el cliente (bbdd)
// app.put(); //actualización
// app.delete(); //eliminación

// app.get('/api/bebesaurios',(req,res) => {
//     res.send(['benji', 'criss', 'kenny', 'maruuchan']);
// });

//las variables que se solicitan en las rutas de las peticiones siempre son string, si se desean números, se deben parsear

//Variables de entorno (para no tener que cambiar el código, ej: los puertos)

app.get('/usuarios',(req,res) => {
    res.send(usuarios);
});

app.get('/usuarios/:id', (req,res) => {//con los : node entiende que es un parámetro que debe obtener
    //res.send(req.params.id);
    //let usuario = usuarios.find(u => u.id === parseInt(req.params.id)); esta fila se cambió por la de la 38 con el método existeUsuario
    let usuario = existeUsuario(req.params.id);
    if(!usuario) res.status(404).send('El usuario no fue encontrado');
    res.send(usuario);
});

//para guardar un usuario en el arreglo "usuarios"
app.post('/usuarios', (req, res) => {
    
    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    
    //const {error, value} = schema.validate({nombre: req.body.nombre}); value toma el valor de req.body.nombre es el parámetro que estoy recibiendo
        const {error, value} = validarUsuario(req.body.nombre); //se cambia el activate del joi por el método
        if(!error) {
            const usuario = {
                    id: usuarios.length +1, //.length+1 devuelve el tamaño del objeto, en este caso el id de usuarios, hace que sea correlativo
                    nombre: value.nombre 
                };
                usuarios.push(usuario);//acá se pasa "usuario" al arreglo "usuarios" mediante .push
                res.send(usuario);
        }else{
            const mensaje = error.details[0].message;
            res.status(400).send(mensaje)
        };

  //Middleware URLencoded -> para recibir datos desde un formulario, trabaja en el PUT
//     let body = req.body;
//     console.log(body.nombre);
//     res.json({
//         body
//     });

    });

    app.put('/usuarios/:id', (req,res)=> { //actualizar un usuario por el id
        //para validar que existe el usuario
        let usuario = existeUsuario(req.params.id);
        if(!usuario){
            res.status(404).send('El usuario no fue encontrado');
            return;
        };
        //para validar el dato del usuario (nombre)
        const {error, value} = validarUsuario(req.body.nombre);//value toma el valor de req.body.nombre es el parámetro que estoy recibiendo
            if(error) { //acá sólo validamos el error porque queremos hacer una modificación, entonces, si me da un error...
                const mensaje = error.details[0].message;
                res.status(400).send(mensaje);
                return; //para que se corte y no siga la compilación
            };

        usuario.nombre = value.nombre;
        res.send(usuario);
    })

    app.delete('/usuarios/:id',(req,res) => {
        //para validar que el usuario existe
        let usuario = existeUsuario(req.params.id);
        if(!usuario){
            res.status(404).send('El usuario no fue encontrado');
            return;
        }
        //encontrar el índice del usuario encontrado
        const index = usuarios.indexOf(usuario); //index0f me va a devolver el indice de usuario encontrado (el usuario = id)
        usuarios.splice(index, 1); //splice es para eliminar, index es el elemento que se va a eliminar, en este caso el usuario encontrado y hay que indicarle la cantidad, o borrará TODA la lista que encuentre

        res.send(usuario);

    })

    //port guardará el puerto 3000, si no lo encuetra, usará PORT
    const port = process.env.PORT || 3000;
    
    app.listen(port, () => {
        console.log(`Escuchando en el puerto ${port}...`);
    });

    //encontrar si existe el usuario
    function existeUsuario(id){
        return(usuarios.find(u => u.id === parseInt(id)));
    }

    //se pega la validación de nombre del joi
    function validarUsuario(nom){
        const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    })
    return(schema.validate({nombre: nom}));
    };
    

//     if(!req.body.nombre){//validación en caso de no enviar dato
//         res.status(400).send('Debe ingresar un nombre');//400 Bad Request
//         return;
//     }
//     const usuario = {
//         id: usuarios.length +1, //.length+1 devuelve el tamaño del objeto, en este caso el id de usuarios, hace que sea correlativo
//         nombre: req.body.nombre 
//     };
//     usuarios.push(usuario);//acá se pasa "usuario" al arreglo "usuarios" mediante .push
//     res.send(usuario);
