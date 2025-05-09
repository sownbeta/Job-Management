import { get, post } from '../util/axiosConfig.js';

export const getJobs = async () => {
  try {
    const response = await get('/jobs');
    console.log('ok',response);
    
    return response || [];
  } catch (error) {
    console.error('Error in getJobs:', error);
    throw error;
  }
};

export const getJobById = async (id) => {
  try {
    return await get(`/job/${id}`);
  } catch (error) {
    console.error('Error in getJobById:', error);
    throw error;
  }
};

export const deleteJob = async (id) => {
  try {
    return await post(`/delete-job/${id}`);
  } catch (error) {
    console.error('Error in deleteJob:', error);
    throw error;
  }
};

export const updateJob = async (id) => {
  try {
    return await post(`/edit-job/${id}`);
  } catch (error) {
    console.error('Error in updateJob:', error);
    throw error;
  }
};

export const toggleJob = async (id) => {
  try {
   const respone = await post(`/toggle-job/${id}`);
    console.log(respone);
    return respone;
  } catch (error) {
    console.error('Error in toggleJob:', error);
    throw error;
  }
};

export const uploadFile = async (formData) => {
  try {
    return await post('/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
