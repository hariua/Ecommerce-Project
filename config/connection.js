const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}
module.exports={
    connect:(done)=>
    {
       
        const dbName = 'EcommerceProject'

        mongoClient.connect(process.env.url,(err,data)=>
        {
            if(err)
            {
                return done(err)
            }
            else{
                state.db = data.db(dbName)
                done()
            }
        })
    },
    get:()=>
    {
        return state.db
    }
}