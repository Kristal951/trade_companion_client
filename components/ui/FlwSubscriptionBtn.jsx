// import React from "react";
// import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";

// const FlwSubscriptionButton = ({ name, email, planKey, amount, planID }) => {
//   const config = {
//     public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
//     tx_ref: `sub_${planKey}_${Date.now()}`,
//     payment_plan: planID,
//     payment_options: "card,mobilemoney,ussd",
//     customer: {
//       email: email,
//       name: name,
//     },
//     customizations: {
//       title: "Trade Companion",
//       description: "Payment for items in cart",
//       logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
//     },
//   };

//   const fwConfig = {
//     ...config,
//     text: "Pay with Flutterwave!",
//     callback: (response) => {
//       console.log(response);
//       closePaymentModal();
//     },
//     onClose: () => {},
//   };

//   return <FlutterWaveButton {...fwConfig} />;
// };

// export default FlwSubscriptionButton;
