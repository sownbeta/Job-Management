import { get, post } from '../util/axiosConfig.js';

const handleRequest = async (method, url, data = null, headers = {}) => {
  try {
    const response = await method(url, data, { headers });
    console.log(`Request to ${url} successful:`, response);
    return response;
  } catch (error) {
    console.error(`Error in request to ${url}:`, error);
    throw error;
  }
};

export const getJobs = () => handleRequest(get, '/jobs');

export const getJobById = (id) => handleRequest(get, `/job/${id}`);

export const deleteJob = (id) => handleRequest(post, `/delete-job/${id}`);

export const updateJob = (id, data) => handleRequest(post, `/edit-job/${id}`, data);

export const toggleJob = (id) => handleRequest(post, `/toggle-job/${id}`);

export const uploadFile = (formData) =>
  handleRequest(post, '/upload-file', formData, { 'Content-Type': 'multipart/form-data' });
