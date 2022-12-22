const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
let alert = require('alert');
var currUser;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/canteenDB");

const customerSchema = {
  name: String,
  phone: Number,
  email: String,
  password: String
}

const foodSchema = {
  item_id: Number,
  item: String,
  picture: String,
  price: Number,
  ingredients: String,
}

const cartSchema = {
  email: String,
  items: [foodSchema]
}

const orderSchema = {
  order: [cartSchema.items],
  amount: Number,
  campus: String,
  hostel: String
}

const Customer = mongoose.model("Customer", customerSchema)
const Food = mongoose.model("Food", foodSchema)
const Cart = mongoose.model("Cart", cartSchema)
const Order = mongoose.model("Order", orderSchema)

// Adding menu items

var menuItems = [{
    item_id: 1,
    item: "Panner Peppery Pizza",
    picture: "images/pizza.jpg",
    price: 350,
    ingredients: "Cheeze, bread, paneer"
  },
  {
    item_id: 2,
    item: "OB cheeze burger",
    picture: "images/burger.jpg",
    price: 120,
    ingredients: "Cheeze, bread, potato, mayonese"
  },
  {
    item_id: 3,
    item: "Momos",
    picture: "images/momos.jpg",
    price: 100,
    ingredients: "Cabbage, mayonese, paneer"
  },
  {
    item_id: 4,
    item: "Oreo Shake",
    picture: "images/shake.jpg",
    price: 150,
    ingredients: "Milk, chcocolate, oreo, sugar"
  },
  {
    item_id: 5,
    item: "Cake",
    picture: "images/cake.jpg",
    price: 400,
    ingredients: "Milk, chcocolate, sugar, cream, bread"
  },
  {
    item_id: 6,
    item: "Sandwich",
    picture: "images/sandwich.jpg",
    price: 120,
    ingredients: "Bread, vegetables, Mayonese, chesse"
  }
];

// Food.collection.insertMany(menuItems, function(err) {
//   if (err) {
//     console.log(err);
//   }
// })
// ---------------------------------------------------------

app.get("/", function(req, res) {
  res.render("home")
});

app.get("/register", function(req, res) {
  res.render("register",{registrationFailed:''})
});

app.get("/login", function(req, res) {
  res.render("login",{loginFailed:''})
});

app.get("/menu", function(req, res) {
  Food.find({}, function(err, foundItems) {
    if (!err) {
      console.log(foundItems)
      res.render("menu", {
        allItems: foundItems
      })
    } else {
      console.log(err)
    }

  })
});

app.get("/cart", function(req, res) {
  // console.log(currUser)
  Cart.findOne({
    email: currUser
  }, function(err, foundItems) {
    if (!err) {
      const checkout = foundItems.items;
      // console.log(foundItems.items);

      var totalBill = 0;
      foundItems.items.forEach(function(getPrice) {
        totalBill = totalBill + getPrice.price
      })
      // console.log(totalBill)

      res.render("cart", {
        allCartItems: checkout,
        TotalnoCharges: totalBill,
        Total: totalBill+40
      })
    } else {
      console.log(err)
    }
  })
});


app.post("/register", function(req, res) {
  if (req.body.password === req.body.repeat_password) {
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const password = req.body.password;

    const newCust = new Customer({
      name: name,
      phone: phone,
      email: email,
      password: password
    });

    newCust.save(function(err) {
      if (!err) {
        res.redirect("/menu");
        currUser = email;
        // console.log(currUser)
      }
    })
  } else {
    res.render("register",{registrationFailed:'Password did not matched. Try again!'})

  }
});

app.post("/login", function(req, res) {
  const mail_id = req.body.email;
  const pass = req.body.password;
  Customer.findOne({
    email: mail_id
  }, function(err, foundCust) {
    if (err) {
      console.log(err);
    } else {
      if (foundCust) {
        if (foundCust.password === pass) {
          res.redirect("/menu");
          currUser = mail_id;
          // console.log(currUser)
        } else {
          res.render("login",{loginFailed:'Incorrect username or password! Please try again.'})
        }
      } else {
        res.render("login",{loginFailed:'No Username/Password found! Do get yourself registered first!'})
      }
    }
  })
})

app.post("/buttonCart", function(req, res) {
  // console.log(currUser)
  const user_mail = currUser;
  const item_ordered_id = Object.keys(req.body)[0];

  // console.log(user_mail)
  // console.log(item_ordered_id)

  Cart.findOne({
    email: user_mail
  }, function(err, founditem) {
    if (err) {
      console.log(err);
    } else {
      if (founditem) {
        Food.findOne({
          item_id: item_ordered_id
        }, function(err, foundFood) {
          if (err) {
            console.log(err);
          } else {
            if (foundFood) {
              console.log(foundFood)
              Cart.updateOne({
                email: user_mail
              }, {
                $push: {
                  items: foundFood
                }
              }, function(err) {
                if (err) {
                  console.log(err);
                }
              })
            }
          }
        })

        res.redirect("/menu")
      } else {
        Food.findOne({
          item_id: item_ordered_id
        }, function(err, foundFood) {
          if (err) {
            console.log(err);
          } else {
            if (foundFood) {
              console.log(foundFood)
              const newCartItem = new Cart({
                email: user_mail,
                items: foundFood
              });

              newCartItem.save(function(err) {
                if (!err) {
                  res.redirect("/menu");
                }
              })
            }
          }
        })
      }
    }
  })

})

app.post("/orderNow", function(req, res) {

  const del_hostel = req.body.hostelNo;
  const del_campus = req.body.Campus;
  const payable = parseInt(Object.keys(req.body)[0])
  const used_mail = currUser

  Cart.findOne({
    email: used_mail
  }, function(err, foundCart) {
    if (err) {
      console.log(err);
    } else {
      if (foundCart) {
        // console.log(foundCart.items);
        const newOrder = new Order({
          order: foundCart.items,
          amount: payable,
          campus: del_campus,
          hostel: del_hostel
        })
        newOrder.save(function(err) {
          if (!err) {
            res.redirect("/");
            alert("Your order has been successfully placed! Happy Eating")
          }
        })
      }
    }
  })

  Cart.deleteOne({
    email: used_mail
  }, function(err) {
    if (err) {
      console.log(err);
    }
  })

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
})
