/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Home } from "./pages/Home";
import { CategoryPage } from "./pages/Category";
import { ProductDetail } from "./pages/ProductDetail";
import { Admin } from "./pages/Admin";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Profile } from "./pages/Profile";
import { About } from "./pages/About";
import { FAQ } from "./pages/FAQ";
import { Contact } from "./pages/Contact";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { SEOLanding } from "./pages/SEOLanding";
import { Rating } from "./pages/Rating";
import { AppProvider } from "./context/AppContext";
import { AIChatBox } from "./components/chat/AIChatBox";
import { ScrollToTop } from "./components/ScrollToTop";

export default function App() {
  return (
    <HelmetProvider>
      <AppProvider>
        <Router>
          <ScrollToTop />
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
        <AIChatBox />
      </Router>
      </AppProvider>
    </HelmetProvider>
  );
}
