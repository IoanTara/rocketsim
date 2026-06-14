import React from 'react';
import { useStore } from './store/useStore.js';
import Home from './screens/Home/index.jsx';
import Params from './screens/Params/index.jsx';
import Launch from './screens/Launch/index.jsx';
import Results from './screens/Results/index.jsx';
import History from './screens/History/index.jsx';
import More from './screens/More/index.jsx';
import BottomNav from './components/BottomNav/index.jsx';

const SCREENS = {
  home: Home,
  params: Params,
  launch: Launch,
  results: Results,
  history: History,
  more: More,
};

export default function App() {
  const screen = useStore(s => s.screen);
  const Screen = SCREENS[screen] || Home;
  return (
    <>
      <BottomNav />
      <Screen />
    </>
  );
}
