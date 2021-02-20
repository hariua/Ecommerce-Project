var db =  require('../config/connection')
var collection = require('../config/collection')
const moment = require('moment')
var objectId = require('mongodb').ObjectID

module.exports={
    getTotalOrders:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
           
           let orderLength = orders.length
           
           resolve(orderLength)
        })
    },
    getPlacedOrders:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let orders = await db.get().collection(collection.ORDER_COLLECTION).find({Status:"placed"}).toArray()
           
           let orderLength = orders.length
           
           resolve(orderLength)
        })        
    },
    getCancelledOrders:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let orders = await db.get().collection(collection.ORDER_COLLECTION).find({Status:"Cancelled"}).toArray()
           
           let orderLength = orders.length
           
           resolve(orderLength)
        })        
    },
    getShippedOrders:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let orders = await db.get().collection(collection.ORDER_COLLECTION).find({Status:"Shipped"}).toArray()
           
           let orderLength = orders.length
           
           resolve(orderLength)
        })        
    },
    getDailyOrders:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let dateIso = new  Date()
            let date = moment(dateIso).format('DD-MM-YYYY')
           let todayOrders = await db.get().collection(collection.ORDER_COLLECTION).find({Date:date,Status:{$ne:'Cancelled'}}).toArray()
           let orders = await db.get().collection(collection.ORDER_COLLECTION).find({Status:{$ne:'Cancelled'}}).toArray()
           let todayOrderLen = todayOrders.length
           let orderLen = orders.length
           let todayOrderPercentage = ((todayOrderLen/orderLen)*100).toFixed(2)
           console.log("per"+todayOrderPercentage);
           
           resolve(todayOrderPercentage)
        }) 
    }
}