
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AppRoutes } from './AppRoutes.tsx';

const App: React.FC = () => {
  return (
    <ReactRouterDOM.HashRouter>
      <AppRoutes />
    </ReactRouterDOM.HashRouter>
  );
};

export default App;
