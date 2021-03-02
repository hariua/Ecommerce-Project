var db = require('../config/connection')
var collection = require('../config/collection')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const { response } = require('express')
const { PRODUCT_COLLECTION } = require('../config/collection')
const Razorpay = require('razorpay')
const moment = require('moment')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_65QtpTCsZaSsL7',
    key_secret: 'JIbfL8ylyjMsr7SIz4Ki0GEU',
});

module.exports = {
    userExist: (userData) => {
        signupMsg = {}
        return new Promise(async (resolve, reject) => {
            let userEmail = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (userEmail) {
                signupMsg.Email = true
            }
            let userPhone = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: userData.Mobile })
            if (userPhone) {
                signupMsg.Mobile = true
            }
            if (!userEmail && !userPhone) {



                resolve()

            }
            else {
                reject(signupMsg)
            }


        })
    },
    signupUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            let data = {}
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
                data.user = userData
                data.id = response.ops[0]._id
                resolve(data)
            }).catch((err)=>
            {
                console.log("error",err);
                reject(err)
            })
        })
    },
    loginUser: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: userData.Mobile })
            if (user) {
                let stat = user.Status
                if (!stat) {
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
                else {
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
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: {
                            products: proObj
                        }
                    }).then((response) => {
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
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let CartItem = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] },
                        subtotal: { $multiply: [{ $arrayElemAt: ["$products.Price", 0] }, "$quantity"] }

                    }

                }

            ]).toArray()

            console.log(CartItem);
            resolve(CartItem)

        })
    },
    delCartProduct: (value) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(value.cartId) }, {
                $pull: {
                    products: { item: objectId(value.proId) }
                }
            }).then((response) => {
                resolve({ deleteSingleProduct: true })
            })
        })
    },
    changeProductQty: (details) => {
        console.log(details)
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                    $pull: {
                        products: { item: objectId(details.product) }
                    }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            }
            else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) }, {
                    $inc: { 'products.$.quantity': details.count }
                }).then((response) => {

                    resolve({ status: true })
                })
            }

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let user = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (user) {
                count = user.products.length
            }
            resolve(count)
        })
    },
    blockUser: (userId) => {
        console.log(userId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { Status: '1' } }).then((response) => {
                resolve(response)
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $unset: { Status: "" } }).then(() => {
                resolve()
            })
        })
    },
    OtpRequest: (phone) => {
        return new Promise(async (resolve, reject) => {


            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: phone })
            if (user) {
                let stat = user.Status
                if (!stat) {
                    console.log(user.Mobile);
                    resolve(user.Mobile)
                }
                else {
                    reject()
                }

            }
            else {
                reject()
            }



        })
    },
    getUserOtp: (phone) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Mobile: phone })

            if (user) {
                resolve(user)
            }
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }

                    }

                },
                {
                    $project: {
                        unitPrice: { $toInt: '$product.Price' },
                        quantity: { $toInt: '$quantity' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
                    }
                }

            ]).toArray()

            if(total.length>0){
                resolve(total[0].total)
            }else{
                total=0
                resolve(total)
            }
            

        })
    },
    getSubTotal: (userId,proId) => {
        return new Promise(async (resolve, reject) => {
            let subtotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $match:{
                        item:objectId(proId)
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }

                    }

                },
                {
                    $project: {
                        unitPrice: { $toInt: '$product.Price' },
                        quantity: { $toInt: '$quantity' }
                    }
                },
                {
                    $project: {
                        _id: null,
                        subtotal: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
                    }
                }

            ]).toArray()

            if(subtotal.length>0)
            {
                resolve(subtotal[0].subtotal)
            }
            else{
                subtotal=0
                resolve(subtotal)
            }
            

        })
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order.Payment === 'COD' ? 'placed' : 'pending'
            let dateIso = new  Date()
            let date = moment(dateIso).format('YYYY/MM/DD')
            let time = moment(dateIso).format('HH:mm:ss')
            let orderObj = {
                deliveryDetails: {
                    FirstName: order.FirstName,
                    LastName: order.LastName,
                    House: order.House,
                    Street: order.Street,
                    Town: order.Town,
                    PIN: order.PIN,
                    Mobile: order.Mobile
                },
                Email: order.Email,
                User: order.User,
                PaymentMethod: order.Payment,
                Products: products,
                Total: total,
                Discount: order.Discount,
                Date: date,
                Time:time,
                Status: status

            }
            if(status=='placed')
            {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(orderObj.User) })
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {

                resolve(response.ops[0]._id)

            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            resolve(cart.products)

        })
    },
    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log("hai" + userId)
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ User: userId }).sort({ Date: -1,Time: -1 }).toArray()
            console.log(order);
            resolve(order)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItem = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $project: {
                        item: '$Products.item',
                        quantity: '$Products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'

                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] },


                    }

                }

            ]).toArray()

            resolve(orderItem)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log("hari", order);
                resolve(order)
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'JIbfL8ylyjMsr7SIz4Ki0GEU');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    Status: "placed"
                }
            }).then(() => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
                resolve()
            })
        })
    },
    addNewAddress: (details) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(details.User) })
            if (user.address) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(details.User) }, {
                    $push: {
                        address: details
                    }
                }).then(() => {
                    resolve()
                })
            } else {

                addr = [details]
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(details.User) }, {
                    $set: {
                        address: addr
                    }
                }).then((user) => {
                    resolve(user)
                })
            }

        })
    },
    getUserAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            console.log(user);
            let address = user.address

            resolve(address)
        })
    },
    addressChecker: (userId) => {
        return new Promise(async (resolve, reject) => {
            let status = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user.address) {
                status.address = true
            }
            resolve(status)



        })
    },
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(user)

        })
    },
    changePassword: (data, userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user) {
                console.log(data.CurrentPassword);
                console.log(user.Password);
                bcrypt.compare(data.CurrentPassword, user.Password).then(async(status) => {
                    if (status) {
                        console.log("Psd Match");
                        data.NewPassword = await bcrypt.hash(data.NewPassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                            $set: {
                                Password: data.NewPassword
                            }
                        }).then((response) => {
                            response.success = true
                            resolve(response)
                        })

                    }
                    else {
                        response.failure = true
                        resolve(response)
                    }

                })
            }
        })
    }

} 