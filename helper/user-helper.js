var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const { response } = require('express')


module.exports = {
    signupUser:(userData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            let userPhone = await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:userData.Mobile})
            if(!userEmail && !userPhone)
            {
                // if(!userPhone)
                // {
                    userData.Password = await bcrypt.hash(userData.Password,10)
                    db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response)=>
                    {
                        resolve(response.ops[0])
                    })
                // }
            }
            else{
                reject()
            }
        
                
        })
    },
    loginUser:(userData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user)
            {
                bcrypt.compare(userData.Password,user.Password).then((status)=>
                {
                    if(status)
                    {
                        console.log("Login Success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else{
                        console.log(("Login Failure"));
                        response.invalidPassword=true
                        response.status = false
                        resolve(response)
                    }
                })

            }
            else{
                console.log("Invalid User");
                response.invalidUser = true
                response.status = false
                resolve(response)
            }
        })
    }
} 