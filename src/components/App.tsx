import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { Page } from '@patternfly/react-core';
import { Store, Router as LibRouter } from 'openshift-assisted-ui-lib';
import history from '../history';
import Header from './ui/Header';
// import Sidebar from './Sidebar';
import BackgroundImage from './ui/BackgroundImage';

import '../styles/index.css';

const { store } = Store;

const App: React.FC = () => (
  <Provider store={store}>
    <Router history={history}>
      <BackgroundImage />
      <Page
        header={<Header />}
        // sidebar={<Sidebar />}
        style={{ height: '100vh', background: 'transparent' }}
        isManagedSidebar // enable this to automatically hide sidebar in mobile
        defaultManagedSidebarIsOpen={false}
      >
        <LibRouter />
      </Page>
    </Router>
  </Provider>
);
export default App;
