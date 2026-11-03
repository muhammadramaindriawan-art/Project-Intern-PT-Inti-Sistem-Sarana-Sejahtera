import React, { useState } from 'react';

const Login = ({ onLogin, onRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength and requirements for sign up
    if (isSignUp && name === 'password') {
      const requirements = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      };
      
      setPasswordRequirements(requirements);
      
      // Calculate password strength (0-4)
      const strength = Object.values(requirements).filter(Boolean).length;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Register
        if (formData.password !== formData.confirmPassword) {
          alert('Password confirmation does not match');
          setLoading(false);
          return;
        }
        
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.requiresVerification) {
            setPendingUser(data.user);
            setShowOTP(true);
            alert(`Registration successful! Please check your email for OTP.\n\nFor testing purposes, OTP is: ${data.otp || 'Check console'}`);
          } else {
            await onRegister(formData);
          }
        } else {
          alert(data.error || 'Registration failed');
        }
      } else {
        // Login
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          if (data.requiresVerification) {
            setPendingUser(data.user);
            setShowOTP(true);
            alert(`Account not verified! Please check your email for OTP.\n\nFor testing purposes, OTP is: ${data.otp || 'Check console'}`);
          } else {
            await onLogin(formData);
          }
        } else {
          alert(data.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email, otp: otp })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Account verified successfully! You can now login with your email and password.');
        setShowSuccessMessage(true);
        setShowOTP(false);
        setOtp('');
        setPendingUser(null);
        
        // Reset form data dan kembali ke mode login
        setFormData({
          email: '',
          password: '',
          username: '',
          firstName: '',
          lastName: '',
          confirmPassword: ''
        });
        setIsSignUp(false);
        
        // Sembunyikan pesan sukses setelah 5 detik
        setTimeout(() => {
          setShowSuccessMessage(false);
          setSuccessMessage('');
        }, 5000);
      } else {
        alert(data.error || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      alert('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingUser.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('OTP sent successfully! Check your email.');
      } else {
        alert(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert('Network error. Please try again.');
    }
  };

  // OTP Verification Screen (tetap sama)
  if (showOTP) {
    return (
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden'
      }}>
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -2
          }}
        >
          <source src="/videos/bg4.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Overlay untuk readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: -1
        }}></div>

        {/* OTP Container */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          padding: '36px',
          width: '100%',
          maxWidth: '420px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '6px',
              letterSpacing: '-0.025em'
            }}>
              Verify Your Email
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Enter the 6-digit code sent to {pendingUser?.email}
            </p>
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              margin: '8px 0 0 0',
              lineHeight: '1.4',
              fontStyle: 'italic'
            }}>
              After verification, you'll be redirected to login page
            </p>
          </div>

          <form onSubmit={handleOTPSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                OTP Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ea8de';
                  e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: (otpLoading || otp.length !== 6) ? '#94a3b8' : '#4ea8de',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: (otpLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: (otpLoading || otp.length !== 6) ? 'none' : '0 4px 12px rgba(78, 168, 222, 0.3)'
              }}
            >
              {otpLoading ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={handleResendOTP}
              style={{
                background: 'none',
                border: 'none',
                color: '#4ea8de',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Resend OTP
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              onClick={() => {
                setShowOTP(false);
                setOtp('');
                setPendingUser(null);
                // Reset form data jika kembali dari sign up
                if (isSignUp) {
                  setFormData({
                    email: '',
                    password: '',
                    username: '',
                    firstName: '',
                    lastName: '',
                    confirmPassword: ''
                  });
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(100, 116, 139, 0.1)';
                e.target.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = '#64748b';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to {isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflow: 'hidden'
    }}>
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -2
        }}
      >
        <source src="/videos/bg4.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay untuk readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: -1
      }}></div>

      {/* Login Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: '20px',
        padding: '36px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header dengan Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            background: '#f8fafc',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setIsSignUp(false)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: isSignUp ? 'transparent' : '#4ea8de',
                color: isSignUp ? '#64748b' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: isSignUp ? 'none' : '0 2px 4px rgba(78, 168, 222, 0.2)'
              }}
            >
              Log In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: isSignUp ? '#4ea8de' : 'transparent',
                color: isSignUp ? 'white' : '#64748b',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: isSignUp ? '0 2px 4px rgba(78, 168, 222, 0.2)' : 'none'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '6px',
            letterSpacing: '-0.025em'
          }}>
            {isSignUp ? 'Create Account' : 'SMK PALAPA PARE'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {isSignUp ? 'Join us and start your journey' : 'Sign in to your account'}
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div 
            className="success-message"
            style={{
              background: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
              position: 'relative',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{
              color: '#065f46',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              paddingRight: '30px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              {successMessage}
            </div>
            <button
              onClick={() => {
                setShowSuccessMessage(false);
                setSuccessMessage('');
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#065f46',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(6, 95, 70, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          {isSignUp && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ea8de';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required={isSignUp}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ea8de';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          {isSignUp && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ea8de';
                  e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required={isSignUp}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder={isSignUp ? "Enter your email address" : "Enter your email"}
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4ea8de';
                e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          {/* Password Field - Single field for login, two fields for sign up */}
          {!isSignUp ? (
            // Login mode - single password field
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4ea8de';
                  e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          ) : (
            // Sign up mode - two password fields
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ea8de';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
                {/* Password Strength Indicator (only for sign up) */}
                {formData.password && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        Password strength:
                      </span>
                      <div style={{
                        display: 'flex',
                        gap: '2px'
                      }}>
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            style={{
                              width: '20px',
                              height: '4px',
                              borderRadius: '2px',
                              backgroundColor: passwordStrength >= level 
                                ? (passwordStrength <= 2 ? '#ef4444' : passwordStrength <= 3 ? '#f59e0b' : '#10b981')
                                : '#e5e7eb',
                              transition: 'background-color 0.3s ease'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: passwordStrength <= 2 ? '#ef4444' : passwordStrength <= 3 ? '#f59e0b' : '#10b981'
                      }}>
                        {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                    
                    {/* Password Requirements */}
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      lineHeight: '1.4'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          color: passwordRequirements.length ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {passwordRequirements.length ? '✓' : '✗'}
                        </span>
                        At least 8 characters
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          color: passwordRequirements.uppercase ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {passwordRequirements.uppercase ? '✓' : '✗'}
                        </span>
                        One uppercase letter
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          color: passwordRequirements.lowercase ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {passwordRequirements.lowercase ? '✓' : '✗'}
                        </span>
                        One lowercase letter
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          color: passwordRequirements.number ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {passwordRequirements.number ? '✓' : '✗'}
                        </span>
                        One number
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          color: passwordRequirements.special ? '#10b981' : '#ef4444',
                          fontWeight: '600'
                        }}>
                          {passwordRequirements.special ? '✓' : '✗'}
                        </span>
                        One special character
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword || ''}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4ea8de';
                    e.target.style.boxShadow = '0 0 0 3px rgba(78, 168, 222, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  required={isSignUp}
                />
                {/* Password Match Indicator */}
                {formData.password && formData.confirmPassword && (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: formData.password === formData.confirmPassword ? '#10b981' : '#ef4444',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontWeight: '600' }}>
                      {formData.password === formData.confirmPassword ? '✓' : '✗'}
                    </span>
                    {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (isSignUp && (passwordStrength < 3 || formData.password !== formData.confirmPassword))}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: loading || (isSignUp && (passwordStrength < 3 || formData.password !== formData.confirmPassword)) ? '#94a3b8' : '#4ea8de',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading || (isSignUp && (passwordStrength < 3 || formData.password !== formData.confirmPassword)) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(78, 168, 222, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 16px rgba(78, 168, 222, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(78, 168, 222, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Help message for disabled button */}
        {isSignUp && (passwordStrength < 3 || formData.confirmPassword) && (passwordStrength < 3 || formData.password !== formData.confirmPassword) && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e',
            textAlign: 'center'
          }}>
            {passwordStrength < 3 ? 
              'Please create a stronger password (at least 3 requirements met)' : 
              'Please make sure both passwords match'
            }
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1, transform: translateY(0); }
          }
          
          .success-message {
            animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;