var db =  require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID
const { response } = require('express')

module.exports = {
    getAllUsers:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let user =await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user)
        })
    },
    addProduct:(proDetails)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proDetails).then((response)=>{
                
                resolve(response.ops[0]._id)
            })
        })
    },
    getAllProducts:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
           resolve(product)

        })
    },
    getProductDetails:(proId)=>
    {
        console.log(proId);
        return new Promise(async(resolve,reject)=>{
         let product =   await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
         console.log('pro'+product);
         resolve(product)
            
        })
    },
    updateProduct:(proId,ProDetails)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Name:ProDetails.Name,
                    Description:ProDetails.Description,
                    Price:ProDetails.Price,
                    Stock:ProDetails.Stock,
                    Category:ProDetails.Category
                }
            }).then(()=>
            {
                resolve()
            })
        })
    },
    deleteProduct:(proId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then(()=>
            {
                resolve()
            })
        })
    },
    addCategory:(catName)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catName).then((response)=>
            {
                resolve(response.ops[0])
            })
        })
    },
    getCategory:()=>
    {
        return new Promise((resolve,reject)=>
        {
            let cat = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(cat)
        })
    },
    getCategoryProduct:(category)=>
    {
        console.log(category);
        return new Promise(async(resolve,reject)=>
        {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:category}).toArray()
            
            resolve(products)
        })
    },
    deleteCategory:(catId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then(()=>
            {
                resolve()
            })
        })
    },
    getAllTransactions:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let list = await db.get().collection(collection.ORDER_COLLECTION).find().sort({Date:-1}).toArray()
            resolve(list)
        })
    },
    changeOrderStatus:(orderId,stat)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                $set:{
                    Status:stat
                }
            }).then(()=>
            {
                resolve()
            })
        })
    }
}