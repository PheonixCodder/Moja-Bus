# Accept Payments on your React App

Need to start accepting payments through your React app? In this article, we'll be exploring how to connect Paystack with your React app. We'll be using a sample checkout page on an e-commerce store for our demo

## Introduction

##### Before you begin

You should [create a free Paystack account](https://dashboard.paystack.com/#/signup) which will give you access to your unique test key to test your integration.

We're going to use our public keys for this demo. You can find your API keys on the [API Keys & Webhooks](https://dashboard.paystack.com/#/settings/developers) section of the **Paystack Dashboard** or in the [Developers overview](https://dashboard.paystack.com/v2/developers) page of **Paystack Canvas**.

You'll notice you have two public keys: Test and Live. While building your app, it's a good idea to use your test keys, as this will allow you to simulate transactions. Once your app is production-ready, you can switch over to your live keys.

##### Never use secret keys on client-side

Since this is a client-side integration, it means that our API keys will be exposed. To prevent anyone gaining access to our Paystack account, we want to make sure we're using our **public keys**. Secret keys should only ever be used on the server.

## Project setup

So, let's get to coding. To start off, I'm going to create a new react app. I like to use `yarn` to get started with my react apps, but you're welcome to use `npm` or `npx`.

```bash
1yarn create react-app react-paystack-checkout
```

Once our app is created, we'll need to navigate into our app's directory and start our app:

```bash
1cd react-paystack-checkout2yarn start
```

Let's take a moment and add the UI for our checkout page.

```jsx
1<div className="App">2  <div className="container">3    <div className="item">4      <div className="overlay-effect"></div>5      <img6        className="item-image"7        src="https://images.unsplash.com/photo-1526947425960-945c6e72858f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"8        alt="product"9      />10      <div className="item-details">11        <p className="item-details__title">Coconut Oil</p>12        <p className="item-details__amount">NGN{amount / 100}</p>13      </div>14    </div>15    <div className="checkout">16      <div className="checkout-form">17        <div className="checkout-field">18          <label>Name</label>19          <input/>20        </div>21        <div className="checkout-field">22          <label>Email</label>23          <input/>24        </div>25        <div className="checkout-field">26          <label>Phone</label>27          <input/>28        </div>29      </div>30    </div>31  </div>32</div>
```

Now you should be able to see our beautiful product display in your browser. For the product we're selling, I just grabbed [this cool image](https://unsplash.com/photos/6LBBOwkPzyQ) of a bottle of Coconut oil from Unsplash. I've also hardcoded a product name, and set up our amount to be pulled in later.

Wondering why we're dividing our amount by 100? When calling the Paystack API, you'll want to pass the amount in the smallest currency denomination available. We're selling our product for `NGN 10,000`, which is `1,000,000 kobo`. We don't want to show our customers prices in kobo though, so we divide by 100 to get the Naira equivalent.

## Install Paystack

But our form isn't functional yet. We need to add some logic that will submit our customer's data and initialize a transaction on Paystack. Let's install the [react-paystack](https://github.com/iamraphson/react-paystack) library:

```bash
1yarn add react-paystack
```

Once the library installs successfully, we can add some variables to hold state and a function to handle the state changes. I'll explain the variables we're passing and what they're for in a little bit. For now we'll just add them and hardcode our publicKey and product amount, since they won't be changing.

```jsx
1const publicKey = "pk_your_public_key_here"2  const amount = 1000000 // Remember, set in kobo!3  const [email, setEmail] = useState("")4  const [name, setName] = useState("")5  const [phone, setPhone] = useState("")6
7...8
9<div className="checkout-form">10  <div className="checkout-field">11    <label>Name</label>12    <input13      type="text"14      id="name"15      onChange={(e) => setName(e.target.value)}16    />17  </div>18  <div className="checkout-field">19    <label>Email</label>20    <input21      type="text"22      id="email"23      onChange={(e) => setEmail(e.target.value)}24    />25  </div>26  <div className="checkout-field">27    <label>Phone</label>28    <input29      type="text"30      id="phone"31      onChange={(e) => setPhone(e.target.value)}32    />33  </div>34  <PaystackButton className="paystack-button" {...componentProps} />35</div>
```

## Accept payments

The last thing we'll need to do here is submit the form to Paystack, so we can initialize a transaction. There are three different ways we can use the `react-paystack` library in our app:

1.  **PaystackButton** - The original library implementation
2.  **usePaystackPayment** - An implementation of the library using React Hooks
3.  **PaystackConsumer** - An implementation of the library using React's Context API

Let's use the `PaystackButton` implementation for our app:

```jsx
1import { PaystackButton } from 'react-paystack'
```

There are a few parameters we can pass to the button, but the required ones are:

1.  **email** - All transactions on Paystack require a customer's email address
2.  **amount** - The amount we're charging the customer
3.  **publicKey** - Remember, public keys for client-side code always
4.  **text** - The text you want displayed on your button
5.  **onSuccess** - A function that will run after a successful transaction is completed
6.  **onClose** - A function that will run when the customer closes the Paystack Checkout

Optionally, we can pass a transaction reference and a metadata object. If you don't pass a reference, Paystack will just generate one for you. If you choose to generate your own references, you'll need to make sure that **every reference is unique.** The metadata object lets you store any additional information you would like to for a transaction. Here, we'll be passing the customer's name and phone number in our metadata. We'll put all of this in a `componentProps` object that we'll pass to the `PaystackButton` component.

```jsx
1const componentProps = {2    email,3    amount,4    metadata: {5      name,6      phone,7    },8    publicKey,9    text: "Pay Now",10    onSuccess: () =>11      alert("Thanks for doing business with us! Come back soon."),12    onClose: () => alert("Wait! You need this oil, don't go."),13  }
```

Our `App.js` file should now look like this

```jsx
1
import React, {useState} from "context/paystack/guides/react"

2
import {PaystackButton} from "react-paystack"

3
import "./App.css"

4
5
const App = () => {
    6
    const publicKey = "pk_your_public_key_here"
    7
    const amount = 10000008
    const [email, setEmail] = useState("")
    9
    const [name, setName] = useState("")
    10
    const [phone, setPhone] = useState("")
    11
    12
    const componentProps = {13    email, 14    amount, 15    metadata
:
    {
        16
        name, 17
        phone, 18
    }
,
    19
    publicKey, 20
    text: "Pay Now", 21
    onSuccess: () => 22
    alert("Thanks for doing business with us! Come back soon."), 23
    onClose: () => alert("Wait! Don't leave :("), 24
}
    25
    26
    return (27 < div
    className = "App" > 28 < div
    className = "container" > 29 < div
    className = "item" > 30 < img / > 31 < div
    className = "item-details" > 32 < p > Dancing
    Shoes < /p>33            <p>{amount}</
    p > 34 < /div>35        </div > 36 < div
    className = "checkout-form" > 37 < form > 38 < label > Name < /label>39            <input40              type="text"41              id="name"42              onChange={(e) => setName(e.target.value)}43            / > 44 < label > Email < /label>45            <input46              type="text"47              id="email"48              onChange={(e) => setEmail(e.target.value)}49            / > 50 < label > Phone < /label>51            <input52              type="text"53              id="phone"54              onChange={(e) => setPhone(e.target.value)}55            / > 56 < /form>57          <PaystackButton {...componentProps} / > 58 < /div>59      </div > 60 < /div>61  )62}63
    64
    export default App
```

We can switch back over to the browser now and test our app out. But before we do that, let's add some styles so people will actually want to buy our coconut oil.

```jsx
1@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;1,300&display=swap");2
3.App {4  text-align: center;5  font-family: "Roboto";6  letter-spacing: 0.1rem;7}8
9.container {10  display: flex;11  flex-direction: row;12  margin: 5% auto;13  width: 635px;14  height: 430px;15  background: white;16  box-shadow: 0px 0px 50px rgba(0, 0, 0, 0.5);17}18
19.item {20  width: 50%;21  position: relative;22}23
24.item-image {25  height: 430px;26  width: 100%;27  object-fit: cover;28}29
30.overlay-effect {31  position: absolute;32  top: 0;33  bottom: 0;34  left: 0;35  right: 0;36  opacity: 0.2;37  background-color: #303030;38  overflow: hidden;39  z-index: 1;40}41
42.item-details {43  position: absolute;44  bottom: 0;45  margin-bottom: 5px;46  margin-left: 20px;47  color: #84a17d;48  text-align: left;49}50
51.item-details__title {52  font-size: 22px;53}54
55.item-details__amount {56  font-weight: bolder;57}58
59.checkout {60  background: #84a17d; /* fallback for old browsers */61
62  display: flex;63  flex-direction: column;64  justify-content: center;65  height: 430px;66  width: 50%;67}68
69.checkout-form {70  padding: 20px 20px;71}72
73.checkout-field {74  display: flex;75  flex-direction: column;76  margin-bottom: 20px;77}78
79.checkout-field label {80  text-align: left;81  color: #e0eafc;82  font-size: 10px;83  margin-bottom: 5px;84  text-transform: uppercase;85  letter-spacing: 0.1rem;86}87
88.checkout-field input {89  background-color: transparent;90  border: 1px solid #cecece;91  border-radius: 5px;92  color: #e0eafc;93  height: 35px;94}95
96.paystack-button {97  cursor: pointer;98  text-align: center;99  font-size: 10px;100  letter-spacing: 0.1rem;101  text-transform: uppercase;102  background-color: #bfbfbf;103  font-weight: bold;104  color: #e0eafc;105  border: none;106  border-radius: 5px;107  width: 100%;108  height: 45px;109  margin-top: 40px;110}
```

Switch over to your browser and you should see a much more appealing product display. Now we can make lots of money on our NGN 10,000 bottles of coconut oil 😅

The full code sample is in [this repository](https://github.com/PaystackOSS/sample-react) and you can check out the [live demo](https://react-paystack-guide.netlify.app/).

###### On this Page

-   [Introduction](https://paystack.com/docs/guides/accept_payments_on_your_react_app/#introduction)
-   [Project setup](https://paystack.com/docs/guides/accept_payments_on_your_react_app/#project-setup)
-   [Install Paystack](https://paystack.com/docs/guides/accept_payments_on_your_react_app/#install-paystack)
-   [Accept payments](https://paystack.com/docs/guides/accept_payments_on_your_react_app/#accept-payments)

[##### Join Payslack

Ask questions and discuss ideas with 2000+ developers on Slack](https://join.slack.com/t/payslack/shared_invite/zt-338biukg0-B1KJaBqvEtKWLp7yOUL6sA)[##### Paystack CLI

Learn how to use our CLI to improve your integration experience](https://www.npmjs.com/package/@paystack-oss/dev-cli)[##### Need something else?

If you have any questions or need general help, visit our support page](https://support.paystack.com)