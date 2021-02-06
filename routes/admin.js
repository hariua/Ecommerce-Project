var express = require('express');
const { Db } = require('mongodb');
const collection = require('../config/collection');
var router = express.Router();

var adminHelper = require('../helper/admin-helper')
var userHelper = require('../helper/user-helper')
const verifyAdmin=(req,res,next)=>
{
  if(req.session.adminLoggedIn)
  {
    next()
  }
  else{
    res.redirect('/admin')
  }
}
var adminData = {
  Name:"hari",
  Password:"123"
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.adminLoggedIn)
  {
    res.redirect('/admin/home')
  }
  
  res.render('admin/adminLogin',{'userErr':req.session.adminNameErr,'passwordErr':req.session.adminPasswordErr})
  req.session.adminNameErr=false
  req.session.adminPasswordErr=false
});
router.get('/home',verifyAdmin,(req,res)=>
{
  res.render('admin/adminHome',{admin:true})
 
})
router.post('/login',(req,res)=>
{
  if(req.body.Name==adminData.Name && req.body.Password==adminData.Password)
  {
    req.session.adminLoggedIn = true
    res.redirect('/admin/home')
  }
  else if(req.body.Name!=adminData.Name && req.body.Password==adminData.Password)
  {
    req.session.adminNameErr="Invalid User Name"
    res.redirect('/admin')
  }
  else if(req.body.Name==adminData.Name && req.body.Password!=adminData.Password)
  {
    req.session.adminPasswordErr="Invalid Password"
    res.redirect('/admin')
  }
  else{
    req.session.adminNameErr="Invalid User Name"
    req.session.adminPasswordErr="Invalid Password"
    res.redirect('/admin')
  }
})
router.get('/allUsers',verifyAdmin,(req,res)=>
{
  adminHelper.getAllUsers().then((users)=>
  {
    res.render('admin/allUsers',{admin:true,users})
  })
  
})
router.get('/addUser',verifyAdmin,(req,res)=>
{
  res.render('admin/addUser',{admin:true})
})
router.post('/addUser',(req,res)=>
{
  userHelper.signupUser(req.body).then((response)=>
  {
    res.redirect('/admin/allUsers')
  }).catch(()=>
  {
    res.redirect('/admin/addUser')
  })
})
router.get('/editUser',verifyAdmin,async(req,res)=>
{
  let userDetails = await userHelper.userDetails(req.query.id)
  res.render('admin/editUser',{admin:true,userDetails})
})
router.post('/editUser',(req,res)=>
{
  userHelper.updateUser(req.query.id,req.body).then(()=>
  {
    res.redirect('/admin/allUsers')
  })
})
router.get('/deleteUser',verifyAdmin,(req,res)=>
{
  userHelper.deleteUser(req.query.id).then(()=>
  {
    res.redirect('/admin/allUsers')
  })
})

router.get('/addproduct',verifyAdmin,(req,res)=>
{
  res.render('admin/addProduct',{admin:true})
})
router.post('/addProduct',(req,res)=>
{
  adminHelper.addProduct(req.body).then((id)=>
  {
    let img1 = req.files.Image1
    let img2 = req.files.Image2
    let img3 = req.files.Image3
    img1.mv('./public/product-images/'+id+'a.jpg')
    img2.mv('./public/product-images/'+id+'b.jpg')
    img3.mv('./public/product-images/'+id+'c.jpg')
    res.redirect('/admin/allProducts')
  })
})
router.get('/allProducts',verifyAdmin,async(req,res)=>
{
  let products = await adminHelper.getAllProducts()
  res.render('admin/allProducts',{admin:true,products})
})
router.get('/editProduct',verifyAdmin,async(req,res)=>
{
  
  let products = await adminHelper.getProductDetails(req.query.id)
  res.render('admin/editProduct', { products, admin: true })
  
})
router.post('/editProduct',(req,res)=>
{
  adminHelper.updateProduct(req.query.id,req.body).then(()=>
  {
    res.redirect('/admin/allProducts')
    if(req.files.Image1)
    {
      let img1 = req.files.Image1
      img1.mv('./public/product-images/'+req.query.id+'a.jpg')
    }
    if(req.files.Image2)
    {
      let img2 = req.files.Image2
      img2.mv('./public/product-images/'+req.query.id+'b.jpg')
    }
    if(req.files.Image3)
    {
      let img3 = req.files.Image3
      img3.mv('./public/product-images/'+req.query.id+'c.jpg')
    }
      
      
     
      
  })
})
router.get('/deleteProduct',verifyAdmin,(req,res)=>
{
  adminHelper.deleteProduct(req.query.id).then(()=>
  {
    res.redirect('/admin/allProducts')
  })
})
router.get('/logout',(req,res)=>
{
  req.session.adminLoggedIn=false
  res.redirect('/admin')
})
module.exports = router;
