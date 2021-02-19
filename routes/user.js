var express = require('express');
var router = express.Router();
var userHelper = require('../helper/user-helper')
var adminHelper = require('../helper/admin-helper');
var otp = require('../config/otp-secrets')
const twilio = require('twilio')(otp.accountSID,otp.authToken)
const { Db } = require('mongodb');
const { response } = require('express');

const verifyLogin = async(req,res,next)=>
{
  if(req.session.loggedIn)
  {
    let person = await userHelper.userDetails(req.session.user._id)
    if(!person.Status)
    {
      next()
    }else{
      req.session.loggedIn=false
      res.redirect('/userLogin')
    }

    
  }else{
    req.session.user=false
    res.redirect('/userLogin')
  }
  
}


/* GET home page. */
router.get('/', async function(req, res, next) {
  // if(req.session.loggedIn)
  // {
    
  // }
  let cartCount = null
  let category = await adminHelper.getCategory()
  if(req.session.loggedIn)
  {
    if(req.session.user)
    {
      cartCount = await userHelper.getCartCount(req.session.user._id)
    }
  }
  
  if(req.session.loggedIn)
  {
    
    adminHelper.getAllProducts().then((items)=>
  {
    
    let len = items.length
    var products = items.slice(len-8,len)
    res.render('index',{user:true,products,cartCount,userBtn:req.session.user,category});
  })
  }
  adminHelper.getAllProducts().then((items)=>
  {
    
    
    let len = items.length
    var products = items.slice(len-8,len)
    res.render('index',{user:true,products,cartCount,category});
  })
  
  
});
router.get('/userLogin',(req,res)=>
{
  let ses = req.session.loggedIn
  if(ses)
  {
    res.redirect('/')
  }
  else{
    res.render('user/userLogin',{user:true,'userErr':req.session.invalidUser,'passwordErr':req.session.invalidPassword,'blockErr':req.session.userBlocked})
    req.session.invalidPassword=false
    req.session.invalidUser=false
    req.session.userBlocked=false
  }
 
})
router.post('/userLogin',(req,res)=>
{
  userHelper.loginUser(req.body).then((response)=>
  {
    if(response.status)
    {
    
      req.session.user=response.user
      req.session.loggedIn = true
      res.redirect('/')
    }
    else{
      if(response.invalidUser)
      {
        req.session.invalidUser="Invalid User"
      }
      if(response.invalidPassword)
      {
        req.session.invalidPassword="Invalid Password"
      }
      if(response.userBlocked)
      {
        req.session.userBlocked="You are Temporarily Blocked by Admin"
      }
      res.redirect('/userLogin')
    }
  })
})
router.get('/userSignup',(req,res)=>
{
  let ses = req.session.user
  if(ses)
  {
    res.redirect('/')
  }else{
    res.render('user/userSignup',{user:true,'emailErr':req.session.emailErr,'mobileErr':req.session.mobileErr})
    req.session.emailErr=false
    req.session.mobileErr=false
  }
  
})
router.post('/userSignup',(req,res)=>
{
  userHelper.userExist(req.body).then((response)=>
  {
   
    req.session.genuineUser = req.body
    twilio
    .verify
    .services(otp.serviceID)
    .verifications
    .create({
      to:`+91${req.body.Mobile}`,
      channel:'sms'
    }).then((data)=>
    {
      res.render('user/signupOTPSubmit',{user:true})
    })
     
  }).catch((Msg)=>
  {
    if(Msg.Email)
    {
      req.session.emailErr = "This Email Already Exists"
    }
    if(Msg.Mobile)
    {
      req.session.mobileErr = "This Mobile Number Already Exists"
    }
    res.redirect('/userSignup')
  })
})
router.post('/signupOTPSubmit',(req,res)=>{
  twilio
    .verify
    .services(otp.serviceID)
    .verificationChecks
    .create({
      to:`+91${req.session.genuineUser.Mobile}`,
      code:req.body.Otp
    }).then((data)=>{
      if(data.valid)
      {
        userHelper.signupUser(req.session.genuineUser).then((data)=>
        {
          req.session.user=data.user
          req.session.loggedIn=true
          res.redirect('/')
        })
        
      }
      else{
        res.redirect('/signupOTPSubmit')
      }
            
      
      // req.session.otpPhone=null
    })  
})
router.get('/signupOTPSubmit',(req,res)=>
{
  res.render('user/signupOTPSubmit',{user:true})
})
router.get('/userProduct',async(req,res)=>
{
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  adminHelper.getProductDetails(req.query.id).then((product)=>
  {
    res.render('user/userProduct',{user:true,product,cartCount,userBtn:req.session.user})
  })
  
})
router.get('/userCart',verifyLogin,async(req,res)=>
{
  let product = await userHelper.getCartProducts(req.session.user._id)
  
 if(product.length>0)
 {
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/userCart',{user:true,product,'userBtn':req.session.user._id,cartCount,total})
 }
 else{
   res.render('user/emptyCart',{user:true})
 }
  
})
router.get('/add-to-cart',verifyLogin,(req,res)=>
{
  res.redirect('/userProduct')  
})
router.post('/add-to-cart',verifyLogin,(req,res)=>{
  userHelper.addToCart(req.body.proId,req.session.user._id).then((response)=>
  {
    res.json({cartOne:true})
  })
})
router.post('/delete-cart-item',(req,res)=>
{
  
  userHelper.delCartProduct(req.body).then((response)=>
  {
    res.json(response)
  })
})
router.post('/change-product-qty',(req,res,next)=>
{
  
  userHelper.changeProductQty(req.body).then(async(response)=>
  {
    response.subtotal = await userHelper.getSubTotal(req.session.user._id)
    response.total = await userHelper.getTotalAmount(req.body.user)
    
      res.json(response)
    
    
  })
}
)
router.get('/userLogout',(req,res)=>
{
  req.session.loggedIn=false
  req.session.user=null
  
  res.redirect('/userLogin')
})
router.get('/allProducts',async(req,res)=>
{
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  
  adminHelper.getAllProducts().then((items)=>
  {
  
  products = items.slice(0,12) 
    res.render('user/allProducts1',{user:true,products,cartCount,userBtn:req.session.user});
  })
})
router.get('/allProducts2',async(req,res)=>
{
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  
  adminHelper.getAllProducts().then((items)=>
  {
  let val=items.length
  products = items.slice(12,val) 
    res.render('user/allProducts2',{user:true,products,cartCount,userBtn:req.session.user});
  })
})
router.get('/getCategoryProduct/:category',async(req,res)=>
{
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
 
  adminHelper.getCategoryProduct(req.params.category).then((products)=>
  {
    console.log(products);
    res.render('user/categoryProducts',{user:true,products,cartCount,userBtn:req.session.user});
  })

  
})
router.get('/userOTPLogin',(req,res)=>
{
  res.render('user/userOTPLogin',{user:true,"phoneErr":req.session.phone})
  req.session.phone=false
})
router.post('/userOTPLogin',(req,res)=>
{
 
  userHelper.OtpRequest(req.body.Mobile).then((number)=>
  {
    req.session.otpPhone=number
    twilio
    .verify
    .services(otp.serviceID)
    .verifications
    .create({
      to:`+91${number}`,
      channel:'sms'
    }).then((data)=>
    {
      res.render('user/userOTPSubmit',{user:true})
    })
    
    
    
  }).catch(()=>
  {
    req.session.phone="User is not Valid"
    res.redirect('/userOTPLogin')
  })
  
})
router.get('/userOTPSubmit',(req,res)=>
{
  res.render('user/userOTPSubmit',{user:true})

})
router.post('/userOTPSubmit',(req,res)=>
{
 
  // let number = req.session.otpPhone
  twilio
    .verify
    .services(otp.serviceID)
    .verificationChecks
    .create({
      to:`+91${req.session.otpPhone}`,
      code:req.body.Otp
    }).then((data)=>{
      if(data.valid)
      {
        userHelper.getUserOtp(req.session.otpPhone).then((user)=>
        {
          req.session.user=user
          req.session.loggedIn=true
          res.redirect('/')
        })
        req.session.otpPhone=null
      }
      else{
        res.redirect('/userOTPSubmit')
      }
            
      
      // req.session.otpPhone=null
    }).catch((data)=>
    {
      
      res.redirect('/userOTPSubmit')
    })
})
router.get('/placeOrder',async(req,res)=>
{
  var address = null
  userHelper.addressChecker(req.session.user._id).then(async(status)=>
  {
    if(status.address)
    {
       addr = await userHelper.getUserAddress(req.session.user._id)
       let len = addr.length
       address = addr.slice(len-2,len)
    }
    
  })
  
  let items = await userHelper.getCartProducts(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/placeOrder',{user:true,total,items,userBtn:req.session.user,address})
})
router.post('/place-order',async(req,res)=>
{
  
  let products = await userHelper.getCartProductList(req.body.User)
  let total = await userHelper.getTotalAmount(req.body.User)
  userHelper.placeOrder(req.body,products,total).then((orderId)=>
  {
    req.session.orderId = orderId
    if(req.body.Payment==='COD')
    {
      res.json({codSuccess:true})
    }else if(req.body.Payment==='Paypal')
    {
      val=total/72
      console.log(val)
      total = val.toFixed(2)
      response.total=total
      response.paypal=true
      res.json(response)
      
    }
    else{
        userHelper.generateRazorpay(orderId,total).then((response)=>
        {
          
          res.json(response)
        })
    }
  })
 
})
router.get('/orderSuccess',(req,res)=>
{
  
  res.render('user/orderSuccess',{user:true,orderId:req.session.orderId})
 
})
router.get('/userOrders',(req,res)=>
{
  userHelper.getOrderList(req.session.user._id).then((orderList)=>
  {
    res.render('user/userOrderList',{user:true,orderList,userBtn:req.session.user})
  })

})
router.get('/viewOrderProduct/:id',(req,res)=>
{
  userHelper.getOrderProducts(req.params.id).then((products)=>
  {
    console.log("hello");
    console.log(products);
    res.render('user/orderProduct',{user:true,products,userBtn:req.session.user})
  })
})
router.post('/verify-payment',(req,res)=>
{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>
  {
    userHelper.changePaymentStatus(req.body['order[receipt]'],req.session.user._id).then(()=>
    {
      console.log("Payment Successful");
      res.json({status:true})
    })
    }).catch((err)=>
    {
      console.log(err);
      res.json({status:false})
  })
})
router.get('/addNewAddress',(req,res)=>{
  res.render('user/addNewAddress',{user:true,userBtn:req.session.user})
})
router.post('/addNewAddress',(req,res)=>
{
  userHelper.addNewAddress(req.body).then((data)=>
  {
    res.redirect('/placeOrder')
  })
})
router.post('/paypal-status-change',(req,res)=>
{
  userHelper.changePaymentStatus(req.session.orderId,req.session.user._id).then((response)=>
  {
    res.json({status:true})
  }).catch((err)=>
  {
    res.json({status:false})
  })
})
router.get('/userAccount',(req,res)=>
{
  userHelper.getUserDetails(req.session.user._id).then((user)=>
  {
    res.render('user/userAccount',{user:true,user,'psdSuccess':req.session.passwordChangeSuccess,'psdFailure':req.session.passwordChangeFailure,userBtn:req.session.user})
    req.session.passwordChangeSuccess=false
    req.session.passwordChangeFailure=false
  })
  
})
router.post('/changePassword',(req,res)=>
{
  console.log(req.body)
  userHelper.changePassword(req.body,req.session.user._id).then((response)=>
  {
    if(response.success)
    {
      req.session.passwordChangeSuccess = "Password Has Been Updated Successfully"
      res.redirect('/userAccount')
    }
    if(response.failure)
    {
      req.session.passwordChangeFailure = "You have entered Incorrect Password"
      res.redirect('/userAccount')
    }
  })
})
module.exports = router;
