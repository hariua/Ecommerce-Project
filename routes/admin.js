var express = require('express');
var router = express.Router();


var adminData = {
  Name:"hari",
  Password:"123"
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/adminLogin')
});
router.get('/home',(req,res)=>
{
  res.render('admin/adminHome')
 
})
router.post('/login',(req,res)=>
{
  if(req.body.Name==adminData.Name && req.body.Password==adminData.Password)
  {
    res.redirect('/admin/home')
  }
  else{
    res.redirect('/admin')
  }
})

module.exports = router;
