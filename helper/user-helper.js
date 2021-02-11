var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const { response } = require('express')
const { PRODUCT_COLLECTION } = require('../config/collection')


module.exports = {
    signupUser: (userData) => {
        signupMsg ={}
        return new Promise(async (resolve, reject) => {
            let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if(userEmail)
            {
                signupMsg.Email = true
            }
            let userPhone = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: userData.Mobile })
            if(userPhone)
            {
                signupMsg.Mobile=true
            }
            if (!userEmail && !userPhone) {
                // if(!userPhone)
                // {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
                    resolve(response.ops[0])
                })
                // }
            }
            else {
                reject(signupMsg)
            }


        })
    },
    loginUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: userData.Mobile })
            if (user) {
                let stat = user.Status
                if(!stat)
                {
                    bcrypt.compare(userData.Password, user.Password).then((status) => {
                        if (status) {
                            console.log("Login Success");
                            response.user = user
                            response.status = true
                            resolve(response)
                        }
                        else {
                            console.log(("Login Failure"));
                            response.invalidPassword = true
                            response.status = false
                            resolve(response)
                        }
                    })
                }
                else{
                    console.log("User Blocked")
                    response.userBlocked = true
                    resolve(response)
                }

            }
            else {
                console.log("Invalid User");
                response.invalidUser = true
                response.status = false
                resolve(response)
            }
        })
    },
    userDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })

            resolve(user)
        })
    },
    updateUser: (userId, userData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    Name: userData.Name,
                    Email: userData.Email,
                    Mobile: userData.Mobile
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).deleteOne({ _id: objectId(userId) }).then(() => {
                resolve()
            })
        })
    },
    addToCart: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proObj = {
                item: objectId(proId),
                quantity: 1
            }
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, {
                        $inc: { 'products.$.quantity': 1 }
                    }).then((response) => {
                        resolve(response)
                    })
                }else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                        $push:{
                            products:proObj
                        }
                    }).then((response)=>
                    {
                        resolve(response)
                    })
                }

            } else {
                cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartProducts:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let CartItem = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{
                        user:objectId(userId)
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$products',0]}
                    
                    }
                    
                }
                
            ]).toArray()
            
            console.log(CartItem[0]);
            resolve(CartItem)

        })
    },
    delCartProduct:(value)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(value.cartId)},{
                $pull:{
                    products:{item:objectId(value.proId)}
                }
            }).then((response)=>
            {
                resolve({deleteSingleProduct:true})
            })
        })
    },
    changeProductQty:(details)=>
    {
        console.log(details)
        details.count=parseInt(details.count)
        return new Promise((resolve,reject)=>
        {
            if(details.count==-1 && details.quantity==1)
            {
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},{
                    $pull:{
                        products:{item:objectId(details.product)}
                    }
                }).then((response)=>
                {
                    resolve({removeProduct:true})
                })
            }
            else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},{
                    $inc:{'products.$.quantity':details.count }
                }).then((response)=> 
                {
                    
                    resolve(true)
                }) 
            }
                       
        })
    },
    getCartCount:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let count = 0;
            let user = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(user)
            {
                count = user.products.length
            }
            resolve(count)
        })
    },
    blockUser:(userId)=>
    {
        console.log(userId);
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{Status:'1'}}).then((response)=>{
                resolve(response)
            })
        })
    },
    unblockUser:(userId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$unset:{Status:""}}).then(()=>
            {
                resolve()
            })            
        })
    },
    OtpRequest:(phone)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            
            
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:phone})
            if(user)
            {
                let stat = user.Status
                if(!stat)
                {
                    console.log(user.Mobile);
                    resolve(user.Mobile)
                }
                else{
                    reject()
                }
                
            }
            else{
                reject()
            }
            
            

        })
    },
    getUserOtp:(phone)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Mobile:phone})
            
            if(user)
            {
                resolve(user)
            }
        })
    },
    getTotalAmount:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{
                        user:objectId(userId)
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$products',0]}
                    
                    }
                    
                },
                {
                   $project:{
                    unitPrice:{$toInt:'$product.Price'},
                    quantity:{$toInt:'$quantity'}
                   }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$unitPrice']}}
                    }
                }
                
            ]).toArray()
            
            console.log(total[0].total);
            resolve(total[0].total)

        })        
    }

} 