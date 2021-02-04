const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}
module.exports={
    connect:(done)=>
    {
        const url='mongodb://localhost:27017'
        const dbName = 'EcommerceProject'

        mongoClient.connect(url,(err,data)=>
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