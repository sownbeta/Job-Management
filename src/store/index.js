import { combineReducers, createStore } from 'redux';
import languageReducer from './languageReducer';

const rootReducer = combineReducers({
  language: languageReducer,
});

const store = createStore(rootReducer);

export default store;
