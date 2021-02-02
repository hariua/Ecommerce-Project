var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/userLogin',(req,res)=>
{
  res.render('user/userLogin')
})
router.get('/userSignup',(req,res)=>
{
  res.render('user/userSignup')
})

module.exports = router;
