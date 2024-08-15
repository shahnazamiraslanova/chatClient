import React from 'react';
import { useFormik } from 'formik';
import { useSigninStyles } from './signin.style';
import InputComponent from '../../core/shared/input/input.component';
import ButtonComponent from '../../core/shared/button/button.component';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../core/configs/axios.config';
import { Routes } from '../../router/routes';
import { errorToast, successToast } from '../../core/shared/toast/toast';

// Validation function for form fields
const validate = (values: { username: string }) => {
  const errors: { username?: string } = {};

  if (!values.username) {
    errors.username = 'Username is required';
  }

  return errors;
};

const SigninComponent = () => {
  const { main, title, buttons, form } = useSigninStyles();
  const navigate = useNavigate();

  // Function to handle user authentication
  const authenticateUser = async (userData: { username: string }) => {
    try {
      const response = await axiosInstance.get('https://localhost:7123/api/Auth/Login', {
        params: { name: userData.username }
      });

      // Assuming the response contains an access token or user information
      localStorage.setItem('accessToken', JSON.stringify(response.data));

      // Navigate to home page
      navigate(Routes.home);
      successToast("Logged in");

    } catch (error) {
      console.error('An error occurred while trying to sign in:', error);
      errorToast('Login failed');
    }
  };

  // Formik setup
  const formik = useFormik({
    initialValues: {
      username: ''
    },
    validate,
    onSubmit: values => {
      authenticateUser(values);
    }
  });

  return (
    <div className={main}>
      <p>Welcome to Site</p>
      <h1 className={title}>Sign in</h1>
      <form className={form} onSubmit={formik.handleSubmit}>
        <InputComponent
          name="username"
          label='Enter your username'
          type="text"
          placeholder="Username"
          value={formik.values.username}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.username && formik.errors.username ? formik.errors.username : null}
        />
        <div className={buttons}>
          <ButtonComponent
            content="Sign in"
            btnClassName='buttonMain'
            type="submit"
          />
          <p>OR</p>
          <ButtonComponent
            content="Sign up"
            btnClassName='buttonSecondary'
          />
        </div>
      </form>
    </div>
  );
};

export default SigninComponent;
