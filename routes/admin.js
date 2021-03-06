var express = require('express');
const { Db } = require('mongodb');
const collection = require('../config/collection');
var router = express.Router();

var adminHelper = require('../helper/admin-helper')
var userHelper = require('../helper/user-helper')
var adminDashboard = require('../helper/admin-dashboard')
const verifyAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  }
  else {
    res.redirect('/admin')
  }
}
var adminData = {
  Name: "hari",
  Password: "123"
}
/* GET users listing. */
router.get('/', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/home')
  }

  res.render('admin/adminLogin', { 'userErr': req.session.adminNameErr, 'passwordErr': req.session.adminPasswordErr })
  req.session.adminNameErr = false
  req.session.adminPasswordErr = false
});
router.get('/home', verifyAdmin, async (req, res) => {
  let totalOrders = await adminDashboard.getTotalOrders()
  let ordersPlaced = await adminDashboard.getPlacedOrders()
  let ordersCancelled = await adminDashboard.getCancelledOrders()
  let ordersShipped = await adminDashboard.getShippedOrders()
  let dailyOrderPercentage = await adminDashboard.getDailyOrders()
  let totalUsers = await adminDashboard.getTotalUsers()
  let totalProducts = await adminDashboard.getTotalProducts()
  res.render('admin/adminHome', { admin: true, totalOrders, ordersPlaced, ordersCancelled, ordersShipped, dailyOrderPercentage,totalUsers,totalProducts })

})
router.post('/login', (req, res) => {
  if (req.body.Name == adminData.Name && req.body.Password == adminData.Password) {
    req.session.adminLoggedIn = true
    res.redirect('/admin/home')
  }
  else if (req.body.Name != adminData.Name && req.body.Password == adminData.Password) {
    req.session.adminNameErr = "Invalid User Name"
    res.redirect('/admin')
  }
  else if (req.body.Name == adminData.Name && req.body.Password != adminData.Password) {
    req.session.adminPasswordErr = "Invalid Password"
    res.redirect('/admin')
  }
  else {
    req.session.adminNameErr = "Invalid User Name"
    req.session.adminPasswordErr = "Invalid Password"
    res.redirect('/admin')
  }
})
router.get('/allUsers', verifyAdmin, (req, res) => {
  adminHelper.getAllUsers().then((users) => {

    res.render('admin/allUsers', { admin: true, users })
  })

})
router.get('/addUser', verifyAdmin, (req, res) => {
  res.render('admin/addUser', { admin: true })
})
router.post('/addUser', (req, res) => {
  console.log(req.body);
  userHelper.signupUser(req.body).then((response) => {
    console.log("resp", response);
    let img = req.files.Image1
    console.log('img', img);
    img.mv('./public/user-images/' + response.id + '.jpg')
    res.redirect('/admin/allUsers')
  }).catch(() => {
    res.redirect('/admin/addUser')
  })
})
router.get('/editUser', verifyAdmin, async (req, res) => {
  let userDetails = await userHelper.userDetails(req.query.id)
  res.render('admin/editUser', { admin: true, userDetails })
})
router.post('/editUser', (req, res) => {
  userHelper.updateUser(req.query.id, req.body).then(() => {
    if (req.files.Image1) {
      let img1 = req.files.Image1
      img1.mv('./public/user-images/' + req.query.id + '.jpg')
    }
    res.redirect('/admin/allUsers')
  })
})
router.get('/deleteUser', verifyAdmin, (req, res) => {
  userHelper.deleteUser(req.query.id).then(() => {
    res.redirect('/admin/allUsers')
  })
})

router.get('/addproduct', verifyAdmin, async (req, res) => {
  let category = await adminHelper.getCategory()
  console.log(category);

  res.render('admin/addNewProduct', { category,'catErrPro':req.session.catErrPro })
  req.session.catErrPro=false
})
router.post('/addProduct', (req, res) => {
  if(!req.body.Category == 'empty')
  {
    req.body.Price = parseInt(req.body.Price)
  req.body.Stock = parseInt(req.body.Stock)
  console.log(req.body);
  adminHelper.addProduct(req.body).then((id) => {
    let img1 = req.files.Image1
    let img2 = req.files.Image2
    let img3 = req.files.Image3
    img1.mv('./public/product-images/' + id + 'a.jpg')
    img2.mv('./public/product-images/' + id + 'b.jpg')
    img3.mv('./public/product-images/' + id + 'c.jpg')
    res.redirect('/admin/allProducts')
  })
  }else{
    req.session.catErrPro = "Please Select a Category"
    res.redirect('/admin/addproduct')
  }
})
router.get('/allProducts', verifyAdmin, async (req, res) => {
  let products = await adminHelper.getAllProducts()
  res.render('admin/allProducts', { admin: true, products })
})

router.get('/editProduct', verifyAdmin, async (req, res) => {
  let category = await adminHelper.getCategory()
  let products = await adminHelper.getProductDetails(req.query.id)
  res.render('admin/editProductNew', { products, category })

})
router.post('/editProduct', (req, res) => {
  req.body.Price = parseInt(req.body.Price)
  req.body.Stock = parseInt(req.body.Stock)
  adminHelper.updateProduct(req.query.id, req.body).then(() => {
    res.redirect('/admin/allProducts')
    if (req.files.Image1) {
      let img1 = req.files.Image1
      img1.mv('./public/product-images/' + req.query.id + 'a.jpg')
    }
    if (req.files.Image2) {
      let img2 = req.files.Image2
      img2.mv('./public/product-images/' + req.query.id + 'b.jpg')
    }
    if (req.files.Image3) {
      let img3 = req.files.Image3
      img3.mv('./public/product-images/' + req.query.id + 'c.jpg')
    }




  })
})
router.get('/deleteProduct', verifyAdmin, (req, res) => {
  adminHelper.deleteProduct(req.query.id).then(() => {
    res.redirect('/admin/allProducts')
  })
})
router.get('/logout', (req, res) => {
  req.session.adminLoggedIn = false
  res.redirect('/admin')
})
router.get('/block-user/:id', (req, res) => {

  userHelper.blockUser(req.params.id).then((response) => {
    res.redirect('/admin/allUsers')
  })
})
router.get('/unblock-user/:id', (req, res) => {
  userHelper.unblockUser(req.params.id).then(() => {
    res.redirect('/admin/allUsers')
  })
})
router.get('/addCategory', (req, res) => {
  res.render('admin/addCategory')
})
router.post('/addCategory', (req, res) => {
  adminHelper.addCategory(req.body).then((response) => {
    res.redirect('/admin/addCategory')
    window.alert("Product Added Successfully")
  })
})
router.get('/allCategory', (req, res) => {
  adminHelper.getCategory().then((category) => {
    res.render('admin/allCategories', { admin: true, category })
  })
})
router.get('/deleteCategory', (req, res) => {
  console.log(req.query.id);
  adminHelper.deleteCategory(req.query.id).then(() => {
    res.redirect('/admin/allCategory')
  })
})
router.get('/allTransactions', (req, res) => {
  adminHelper.getAllTransactions().then((list) => {
    res.render('admin/allTransactions', { list })
  })
})
router.get('/userOrderPdt/:id', (req, res) => {
  userHelper.getOrderProducts(req.params.id).then((products) => {

    res.render('admin/singleOrderPdt', { products })
  })
})
router.get('/shipped/:id', (req, res) => {
  status = 'Shipped'
  adminHelper.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/allTransactions')
  })
})
router.get('/delivered/:id', (req, res) => {
  status = 'Delivered'
  adminHelper.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/allTransactions')
  })
})
router.get('/cancelled/:id', (req, res) => {
  status = 'Cancelled'
  adminHelper.changeOrderStatus(req.params.id, status).then(() => {
    res.redirect('/admin/allTransactions')
  })
})
router.get('/offerSection', async (req, res) => {
  let products = await adminHelper.getAllProducts()
  let category = await adminHelper.getCategory()
  res.render('admin/offerProduct', { products, category,'catErr':req.session.catErr,'proErr':req.session.proErr })
  req.session.proErr=false
  req.session.catErr=false
})
router.post('/productOffer', (req, res) => {
  if (req.body.Product != 'empty'){
    adminHelper.productOffer(req.body).then(() => {
      res.redirect('/admin/offerSection')
    })
  }else{
    req.session.proErr = "Please Select a Product"
    res.redirect('/admin/offerSection')
  }
  
})
router.post('/categoryOffer', (req, res) => {
  console.log(req.body);
  if (req.body.Category != 'empty') {
    adminHelper.categoryOffer(req.body).then(() => {
      res.redirect('/admin/offerSection')
    })
  }else{
    req.session.catErr = "Please Select a Category"
    res.redirect('/admin/offerSection')
  }

})
router.get('/allCoupons',(req,res)=>
{
  adminHelper.allCoupons().then((coupon)=>
  {
    res.render('admin/allCoupons',{coupon})
  })
  
})
router.get('/generateCoupon',(req,res)=>
{
  res.render('admin/couponGenerate')
})
router.post('/generateCoupon',(req,res)=>
{
  console.log(req.body);
  adminHelper.generateCoupon(req.body).then(()=>
  {
    res.redirect('/admin/allCoupons')
  })
})
router.get('/salesDate',(req,res)=>
{
  adminHelper.monthlyReport().then((data)=>
  {
    res.render('admin/salesReport',{data})
  })
  // res.render('admin/salesDate')
})
router.post('/salesDate',(req,res)=>
{
  console.log(req.body);
  adminHelper.salesReport(req.body).then((data)=>
  {
    res.render('admin/salesReport',{data})
  })
  

})
module.exports = router;
