var express = require('express');
var router = express.Router();
var userHelper = require('../helper/user-helper')
var adminHelper = require('../helper/admin-helper')

const verifyLogin = (req,res,next)=>
{
  if(req.session.loggedIn)
  {
    next()
  }
  else{
    res.redirect('/userLogin')
  }
}


/* GET home page. */
router.get('/', async function(req, res, next) {
  // if(req.session.loggedIn)
  // {
    
  // }
  let cartCount = null
  if(req.session.user)
  {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  

  adminHelper.getAllProducts().then((products)=>
  {
    console.log(products);
    res.render('index',{user:true,products,cartCount,userBtn:req.session.user});
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
    res.render('user/userLogin',{user:true,'userErr':req.session.invalidUser,'passwordErr':req.session.invalidPassword})
    req.session.invalidPassword=false
    req.session.invalidUser=false
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
module.exports = router;
