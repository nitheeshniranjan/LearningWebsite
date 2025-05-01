import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const userId = localStorage.getItem("id");
  const authToken = localStorage.getItem("token");
  const email = localStorage.getItem("email") || "test@example.com";
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/api/courses")
      .then((response) => response.json())
      .then((data) => {
        setCourses(data);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
      });

    if (userId) {
      fetch(`http://localhost:8080/api/learning/${userId}`)
        .then((response) => response.json())
        .then((data) => {
          const enrolledCourses = data.map(item => item.course_id);
          setEnrolled(enrolledCourses);
        })
        .catch((error) => {
          console.error("Error fetching enrolled courses:", error);
        });
    }
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const enrollCourse = async (courseId, courseName, price) => {
    if (!authToken) {
      toast.error('You need to login to continue', { autoClose: 1000 });
      return setTimeout(() => navigate('/login'), 2000);
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const orderResponse = await axios.post("http://localhost:8080/api/payment/create", {
        amount: price,
        email: email,
        currency: "INR",
        status: "CREATED",
        receipt: "receipt_" + new Date().getTime()
      });

      const options = {
        key: "rzp_test_rxaZBoxqnwAReT", // replace with your Razorpay key
        amount: orderResponse.data.amount * 100,
        currency: "INR",
        name: "Course Purchase",
        description: `Enroll in ${courseName}`,
        order_id: orderResponse.data.razorpayOrderId,

        handler: async function (response) {
          console.log("Razorpay response:", response);
          const paymentData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          };

          try {
            await axios.post("http://localhost:8080/api/payment/verify", paymentData);

            const enrollRequest = {
              userId: userId,
              courseId: courseId
            };

            axios.post('http://localhost:8080/api/learning', enrollRequest)
              .then((response) => {
                if (response.data === "Enrolled successfully") {
                  toast.success('Course Enrolled successfully', {
                    autoClose: 1000,
                  });
                  setTimeout(() => navigate(`/course/${courseId}`), 2000);
                }
              }).catch(err => {
                console.error("Enrollment error", err);
              });
          } catch (error) {
            console.error("Payment verification failed", error);
            toast.error("Payment verification failed", { autoClose: 1000 });
          }
        },

        prefill: {
          email: email,
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment process failed", error);
      toast.error("Payment initiation failed", { autoClose: 1000 });
    }
  };

  return (
    <div>
      <Navbar page="courses" />
      <div className="courses-container" style={{ marginTop: "20px" }}>
        {courses.map((course) => (
          <div key={course.course_id} className="course-card">
            <img src={course.p_link} alt={course.course_name} className="course-image" />
            <div className="course-details">
              <h3 className="course-heading">
                {course.courseName.length < 8
                  ? `${course.courseName} Tutorial`
                  : course.courseName
                }
              </h3>
              <p className="course-description" style={{ color: "grey" }}>
                Price: Rs.{(course.price / 100).toFixed(2)}
              </p>
              <p className="course-description">
                Tutorial by {course.instructor}
              </p>
            </div>
            {enrolled.includes(course.course_id) ? (
              <button
                className="enroll-button"
                style={{ color: '#F4D03F', backgroundColor: 'darkblue', fontWeight: 'bold' }}
                onClick={() => navigate("/learnings")}
              >
                Enrolled
              </button>
            ) : (
              <button
                className="enroll-button"
                onClick={() => enrollCourse(course.course_id, course.courseName, course.price)}
              >
                Enroll
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Courses;
