const path = require("path");
const http = require("http");
const express = require("express");
const session = require("express-session");
const { Server } = require("socket.io");
const formatMessage = require("./utils/messages");


const app = express();
const server = http.createServer(app);
const io = new Server(server);


const botName = "B-Bot";

const junks = {
    2: "Pizza",
    3: "Buritto",
    4: "Shawarma",
    5: "Burger",
    6: "Sandwich"
};
//const orderHistory = [];
let allSelectedMenu = [];

const sessionMiddleware = session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 //set expiry time for session to 1 day
    } 
});
// Set static folder
app.use(express.static(path.join(__dirname, "public")));

//use session middleware
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);


io.on("connection", (socket) => {

    let userName = "";
    socket.session = socket.request.session;
    let orderHistory = [];
    socket.emit("message", formatMessage(botName,"Hello! What is your name?"));
    
    socket.on("userMessage", msg => {
        //Welcome User after they send in their name 
        if (!userName)  {
            showUserMessage(msg)

            userName = msg;
            setTimeout( ()=> {
                socket.emit("message", formatMessage(botName, `Welcome ${userName} to Bhbee's Restaurant! <br> <br> Select 1 to Place an order <br> Select 99 to checkout order <br> Select 98 to see order history <br> Select 97 to see current order <br> Select 0 to cancel order`))
            }, 1000)
        }
        else{

            switch (msg) {
                //if user seelects 1, show a list of junk foods they can place an order on
                case "1":
                    showUserMessage(msg)
                    setTimeout( ()=> {
                        const junkOptions = Object.keys(junks).map((key) => `${key}. ${junks[key]}`).join("\n");
                        socket.emit("message", formatMessage(botName, `Here is a list of junk food you can order: <br> <br> ${junkOptions} <br> Please select your choice.`));
                    }, 1000)
                    break;
                
                //if user selects (2,3,4,5,or 6), add it to the array of current order and bot should reply that the selected item has been added to your order history
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                    showUserMessage(msg)

                    const selectedIndex = parseInt(msg);
                    if (junks.hasOwnProperty(selectedIndex)) {
                        const selectedItem = junks[selectedIndex];
                        session.currentOrder = [];
                        session.currentOrder.push(selectedItem);
                        session.currentOrder.forEach(element => {
                            allSelectedMenu.push(element)
                        });
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName,`${selectedItem} has been added to your order list. <br> press <br> 97. To see your current list order to be placed  <br> 98. To see your order history <br> 99. To checkout/place your order.`));
                        }, 1000)
                        } 
                    else{
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName,"Invalid selection."));
                        }, 1000)
                        }
                    break;
    
    
                case "97":
                    //When selected, show all current order to be placed 
                    showUserMessage(msg)

                    if (allSelectedMenu.length === 0) {
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName, "No current order. Place an order by selecting <br>1. See menu"
                            ));
                        }, 1000)
                    } 
                    else {
                        const currentOrder = allSelectedMenu.join(", ");
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName,
                            `Here is your current order:\n ${currentOrder} <br> Select <br> 99. To place order`
                            ));
                        }, 1000)
                    }
                    break;
                
                case "98":
                    //Show history of all placed order for the session
                    showUserMessage(msg)
                    
                    if (orderHistory.length === 0) {
                        setTimeout( ()=> { 
                            socket.emit("message", formatMessage(botName, "You don't have any order history. <br> Select <br> 1. To place an order now"));
                        }, 1000)
                    }
                    else {
                        const myOrderHistory = orderHistory
                            .map((order, index) => `${index + 1}: ${order.join(", ")}`)
                            .join("<br>");
                            setTimeout( ()=> {
                                socket.emit("message", formatMessage(botName, `Here is your order history: <br> ${myOrderHistory} <br><br> Select <br> 1. To place another order`));
                            }, 1000)
                        }
                    break;

                case "99":
                    //places an order by adding it to an array containing the list of all placed order in that session
                    showUserMessage(msg)

                    if (allSelectedMenu.length === 0) {
                        setTimeout( ()=> {
                            socket.emit("message",formatMessage(botName, "No order to place. <br> Select <br> 1. To place an order"));
                        }, 1000)
                    } 
                    else {  
                        orderHistory.push(allSelectedMenu)
                        setTimeout( ()=> {socket.emit("message", formatMessage(botName, "Order placed!  <br> Select <br> 0. To cancel order <br> 1. To place another order <br> 98. To see order history" ));
                        allSelectedMenu = []
                        }, 1000)
                    }
                    break;
        
                case "0":
                    //Removes the last order placed from the order history array
                    showUserMessage(msg)

                    if(orderHistory.length > 0){
                        orderHistory.splice(-1)
                        console.log(orderHistory)
                        //allSelectedMenu = []
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName, "Order cancelled"));
                        }, 1000)
                    } 
                    else {
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName, "No current order to cancel"));
                        }, 1000)
                    }
                    break;
    
                default:
                    //bot displays Invalid selection when user's inputs is invalid
                    showUserMessage(msg)

                    setTimeout( ()=> {
                        socket.emit("message", formatMessage(botName, "Invalid selection."));
                    }, 1000)
                    break;
            }
        }
       
    });  

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    }); 

    function showUserMessage(msg) {
        socket.emit("userMessage", formatMessage(userName, msg))
    }

})
const PORT = process.env.PORT || 3000;
  
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  