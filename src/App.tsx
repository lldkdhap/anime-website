import { Suspense, lazy } from "react";
import { AnimatePresence } from "motion/react";
import { Route, Routes, useLocation } from "react-router";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { CursorGlow } from "./components/CursorGlow";
import { LoadingScreen } from "./components/AsyncState";
import { ParticleBackground } from "./components/ParticleBackground";
import { ScrollToTop } from "./components/ScrollToTop";

const HomePage = lazy(() => import("./pages/HomePage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const RandomPage = lazy(() => import("./pages/RandomPage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  const location = useLocation();
  const particleMode = location.pathname === "/" ? "full" : "subtle";

  return (
    <div className="app-shell">
      <CursorGlow />
      <ParticleBackground mode={particleMode} />
      <div className="app-content">
        <AppHeader />
        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/random" element={<RandomPage />} />
              <Route path="/anime/:source/:id" element={<DetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
        <AppFooter />
      </div>
      <ScrollToTop />
    </div>
  );
}

export default App;