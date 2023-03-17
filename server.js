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
const orderHistory = [];
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
    socket.emit("message", formatMessage(botName,"Hello! What is your name?"));
    
    socket.on("userMessage", msg => {

        if (!userName)  {
            showUserMessage(msg)

            userName = msg;
            setTimeout( ()=> {
                socket.emit("message", formatMessage(botName, `Welcome ${userName} to Bhbee's Restaurant! <br> <br> Select 1 to Place an order <br> Select 99 to checkout order <br> Select 98 to see order history <br> Select 97 to see current order <br> Select 0 to cancel order`))
            }, 1000)
        }
        else{

            switch (msg) {
                case "1":
                    showUserMessage(msg)
                    setTimeout( ()=> {
                        const itemOptions = Object.keys(junks).map((key) => `${key}. ${junks[key]}`).join("\n");
                        socket.emit("message", formatMessage(botName, `Here is a list of junk food you can order: <br> <br> ${itemOptions} <br> Please select your choice.`));
                    }, 1000)
                    break;
                
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
                        allSelectedMenu.push(session.currentOrder);
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName,`${selectedItem} has been added to your order history. <br> press  <br> 98. To see your order <br> 99. To checkout/place your order.`));
                        }, 1000)
                        } 
                    else{
                        setTimeout( ()=> {
                            socket.emit("message", formatMessage(botName,"Invalid selection."));
                        }, 1000)
                        }
                    break;
    
    
                case "97":
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
                            `Here is your current order:\n ${currentOrder}`
                            ));
                        }, 1000)
                    }
                    break;
                
                case "98":
                    showUserMessage(msg)

                    if (orderHistory.length === 0) {
                        setTimeout( ()=> { 
                            socket.emit("message", formatMessage(botName, "You don't have any order history. <br> Select <br> 1. To place an order now"));
                        }, 1000)
                    }
                    else {
                        const myOrderHistory = orderHistory
                            .map((order, index) => `${index + 1}: ${order.join(", ")}`)
                            .join(" \n");
                            setTimeout( ()=> {
                                socket.emit("message", formatMessage(botName, `Here is your order history: <br> ${myOrderHistory} <br><br> Select <br> 1. To place another order`));
                            }, 1000)
                        }
                    break;

                case "99":
                    showUserMessage(msg)

                    if (allSelectedMenu.length === 0) {
                        setTimeout( ()=> {
                            socket.emit("message",formatMessage(botName, "No menu selected. <br> Select <br> 1. To place an order"));
                        }, 1000)
                    } 
                    else {  
                        orderHistory.push(allSelectedMenu)
                        setTimeout( ()=> {socket.emit("message", formatMessage(botName, "Order placed!  <br> Select <br> 1. To place another order <br> 98. To see order history" ));
                        allSelectedMenu = []
                        }, 1000)
                    }
                    break;
        
                case "0":
                    showUserMessage(msg)

                    if(allSelectedMenu.length > 0){
                        allSelectedMenu = []
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
  