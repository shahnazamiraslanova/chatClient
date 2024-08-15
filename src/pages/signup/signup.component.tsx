import React, { useState } from 'react';
import { useFormik, FormikErrors } from 'formik';
import axiosInstance from '../../core/configs/axios.config';
import { useSignupStyles } from './signup.style';
import InputComponent from '../../core/shared/input/input.component';
import ButtonComponent from '../../core/shared/button/button.component';
import { NavLink } from 'react-router-dom';
import { Routes } from '../../router/routes';
import { errorToast, successToast } from '../../core/shared/toast/toast';

// Define the form values type
interface SignupFormValues {
  username: string;
  avatar: File | null; // File for avatar
}

// Validation function for form fields
const validate = (values: SignupFormValues) => {
  const errors: FormikErrors<SignupFormValues> = {};

  if (!values.username) {
    errors.username = 'Username is required';
  }

  return errors;
};

const SignupComponent = () => {
  const classes = useSignupStyles();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Function to handle form submission
  const addUser = async (userData: SignupFormValues) => {
    try {
      const formData = new FormData();
      formData.append('name', userData.username);
      if (selectedFile) {
        formData.append('file', selectedFile, selectedFile.name);
      }

      await axiosInstance.post('https://localhost:7123/api/Auth/Register', formData);
      successToast('Signup successful!');
      formik.resetForm();
    } catch (error) {
      errorToast('An error occurred during signup.');
    }
  };

  // Formik setup
  const formik = useFormik<SignupFormValues>({
    initialValues: {
      username: '',
      avatar: null,
    },
    validate,
    onSubmit: values => {
      addUser(values);
    }
  });

  // Handle file change event
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <div className={classes.main}>
      <div className={classes.signUpHeader}>
        <p>Welcome to Site</p>
        <div>
          <p>Have an Account?</p>
          <NavLink className={classes.signUptoSingIn} to={`/${Routes.signin}`}>Sign in</NavLink>
        </div>
      </div>
      <h1 className={classes.title}>Sign up</h1>
      <form className={classes.form} onSubmit={formik.handleSubmit}>
        <div className={classes.signUpAdditionalFormItem}>
          <InputComponent
            name="username"
            label="Enter username"
            type="text"
            placeholder="Username"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.username && formik.errors.username ? formik.errors.username : null}
          />
        </div>
        <div className={classes.signUpAdditionalFormItem}>
          <InputComponent
            name="avatar"
            label="Upload Avatar"
            type="file"
            placeholder="Avatar"
            onChange={handleFileChange}
            error={formik.touched.avatar && formik.errors.avatar ? formik.errors.avatar : null}
          />
        </div>
        <div className={classes.buttons}>
          <ButtonComponent type='submit' content="Sign up" btnClassName="buttonMain" />
        </div>
      </form>
    </div>
  );
};

export default SignupComponent;
