var express = require('express');
var router = express.Router();
var userHelper = require('../helper/user-helper')
var adminHelper = require('../helper/admin-helper');
var otp = require('../config/otp-secrets')
const twilio = require('twilio')(otp.accountSID,otp.authToken)
const { Db } = require('mongodb');

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
    
    
    var products = items.slice(0,4)
    res.render('index',{user:true,products,cartCount,userBtn:req.session.user});
  })
  }
  adminHelper.getAllProducts().then((items)=>
  {
    
    
    var products = items.slice(0,4)
    res.render('index',{user:true,products,cartCount});
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
  userHelper.signupUser(req.body).then((response)=>
  {
    res.redirect('/')
    res.session.loggedIn=true
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
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }  
  let product = await userHelper.getCartProducts(req.session.user._id)
  // let cartCount = userHelper.getCartCount(req.session.user._id)
  res.render('user/userCart',{user:true,product,userBtn:req.session.user,cartCount})
})
router.get('/add-to-cart',verifyLogin,(req,res)=>
{
  res.redirect('/userProduct')  
})
router.post('/add-to-cart',verifyLogin,(req,res)=>{
  userHelper.addToCart(req.body.proId,req.session.user._id).then(()=>
  {
    res.json({cartOne:true})
  })
})
router.post('/delete-cart-item',(req,res)=>
{
  
  userHelper.delCartProduct(req.body).then(()=>
  {
    res.json({productDelete:true})
  })
})
router.post('/change-product-qty',(req,res,next)=>
{
  
  userHelper.changeProductQty(req.body).then(()=>
  {
    res.json({cartAdd:true})
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
  
  adminHelper.getAllProducts().then((products)=>
  {
    
    res.render('user/allProducts',{user:true,products,cartCount,userBtn:req.session.user});
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
module.exports = router;
