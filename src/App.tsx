/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { AppProvider } from "./context/AppContext";
import { AIChatBox } from "./components/chat/AIChatBox";
import { ScrollToTop } from "./components/ScrollToTop";

const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const CategoryPage = lazy(() => import("./pages/Category").then(m => ({ default: m.CategoryPage })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(m => ({ default: m.ProductDetail })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(m => ({ default: m.ResetPassword })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const Orders = lazy(() => import("./pages/Orders").then(m => ({ default: m.Orders })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const FAQ = lazy(() => import("./pages/FAQ").then(m => ({ default: m.FAQ })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Terms = lazy(() => import("./pages/Terms").then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import("./pages/Privacy").then(m => ({ default: m.Privacy })));
const SEOLanding = lazy(() => import("./pages/SEOLanding").then(m => ({ default: m.SEOLanding })));
const Rating = lazy(() => import("./pages/Rating").then(m => ({ default: m.Rating })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AppProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/reviews" element={<Rating />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/custom-printing" element={<SEOLanding />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        </Suspense>
        <AIChatBox />
      </Router>
      </AppProvider>
    </HelmetProvider>
  );
}
