var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID
var moment = require('moment')
const { response } = require('express')

module.exports = {
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user)
        })
    },
    addProduct: (proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(proDetails).then((response) => {

                resolve(response.ops[0]._id)
            })
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)

        })
    },
    getProductDetails: (proId) => {
        console.log(proId);
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
            console.log('pro' + product);
            resolve(product)

        })
    },
    updateProduct: (proId, ProDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: ProDetails.Name,
                    Description: ProDetails.Description,
                    Price: ProDetails.Price,
                    Stock: ProDetails.Stock,
                    Category: ProDetails.Category
                }
            }).then(() => {
                resolve()
            })
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(proId) }).then(() => {
                resolve()
            })
        })
    },
    addCategory: (catName) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catName).then((response) => {
                resolve(response.ops[0])
            })
        })
    },
    getCategory: () => {
        return new Promise((resolve, reject) => {
            let cat = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(cat)
        })
    },
    getCategoryProduct: (category) => {
        console.log(category);
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: category }).toArray()

            resolve(products)
        })
    },
    deleteCategory: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then(() => {
                resolve()
            })
        })
    },
    getAllTransactions: () => {
        return new Promise(async (resolve, reject) => {
            let list = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ Date: -1 }).toArray()
            resolve(list)
        })
    },
    changeOrderStatus: (orderId, stat) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    Status: stat
                }
            }).then(() => {
                resolve()
            })
        })
    },
    productOffer: (proDetails) => {
        return new Promise(async (resolve, reject) => {
            let offerVal = parseInt(proDetails.Offer)
            let Expiry = moment(proDetails.Expiry).format('DD-MM-YYYY')
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proDetails.Product) }, {
                $set: {
                    Offer: offerVal
                }
            })
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proDetails.Product) })
            if (product.Offer) {
                if (product.actualPrice) {
                    let actualPrice = product.actualPrice
                    let discountVal = ((actualPrice * offerVal) / 100).toFixed()
                    let offerPrice = actualPrice - discountVal
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proDetails.Product) }, {
                        $set: {
                            actualPrice: actualPrice,
                            Price: offerPrice
                        }
                    }).then(() => {
                        resolve()
                    })
                } else {
                    let actualPrice = product.Price
                    let discountVal = ((actualPrice * offerVal) / 100).toFixed()
                    let offerPrice = actualPrice - discountVal
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proDetails.Product) }, {
                        $set: {
                            actualPrice: actualPrice,
                            Price: offerPrice
                        }
                    }).then(() => {
                        resolve()
                    })
                }
            }


        })
    },
    categoryOffer: (catDetails) => {
        return new Promise(async (resolve, reject) => {
            var cat = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: catDetails.Category }).toArray()
            let lim = cat.length
            console.log("array Length", lim);
            let offerVal = parseInt(catDetails.Offer)
            for (let x = 0; x < lim; x++) {
                // db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(cat[x]._id)})
                
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(cat[x]._id) }, {
                    $set: {
                        Offer: catDetails.Offer
                    }
                }).then(()=>
                {
                    db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(cat[x]._id)}).then((data)=>
                    {
                        if (data.Offer) {
                            if (data.actualPrice) {
                                let actualPrice = data.actualPrice
                                let discountVal = ((actualPrice * offerVal) / 100).toFixed()
                                let offerPrice = actualPrice - discountVal
                                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(cat[x]._id) }, {
                                    $set: {
                                        actualPrice: actualPrice,
                                        Price: offerPrice
                                    }
                                }).then(() => {
                                    resolve()
                                })
                            } else {
                                let actualPrice = data.Price
                                let discountVal = ((actualPrice * offerVal) / 100).toFixed()
                                let offerPrice = actualPrice - discountVal
                                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(cat[x]._id) }, {
                                    $set: {
                                        actualPrice: actualPrice,
                                        Price: offerPrice
                                    }
                                }).then(() => {
                                    resolve()
                                })
                            }
                        }
                    })
                })




            }
        })
    }
}