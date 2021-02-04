var express = require('express');
var router = express.Router();
var userHelper = require('../helper/user-helper')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{admin:false});
});
router.get('/userLogin',(req,res)=>
{
  res.render('user/userLogin')
})
router.post('/userLogin',(req,res)=>
{
  userHelper.loginUser(req.body).then((response)=>
  {
    if(response.status)
    {
      res.redirect('/')
    }
    else{
      // if(response.invalidUser)
      // {

      // }
      // if(response.invalidPassword)
      // {

      // }
      res.redirect('/userLogin')
    }
  })
})
router.get('/userSignup',(req,res)=>
{
  res.render('user/userSignup')
})
router.post('/userSignup',(req,res)=>
{
  userHelper.signupUser(req.body).then((response)=>
  {
    res.redirect('/')
  }).catch(()=>
  {
    res.redirect('/userSignup')
  })
})
router.get('/userProduct',(req,res)=>
{
  res.render('user/userProduct')
})
router.get('/userCart',(req,res)=>
{
  res.render('user/userCart')
})

module.exports = router;
