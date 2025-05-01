import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { faBackward } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from 'antd';
import axios from 'axios';

function YourComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = location.pathname.split("/")[2];

  const [test, setTest] = useState([]);
  const [userId] = useState(localStorage.getItem("id"));
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [totalQsns, setTotalQsns] = useState(0);

  // Fetch questions on load
  useEffect(() => {
    fetch(`http://localhost:8080/api/questions/${courseId}`)
      .then(res => res.json())
      .then(res => {
        setTest(res);
        setTotalQsns(res.length);
        setSelectedAnswers(new Array(res.length).fill(null));
      })
      .catch(error => console.error("Error fetching data:", error));
  }, [courseId]);

  // Handle radio option change
  const handleRadioChange = (questionIndex, selectedOption) => {
    const updatedAnswers = [...selectedAnswers];
    const currentQuestion = test[questionIndex];

    // Adjust correct count if needed
    if (updatedAnswers[questionIndex] === currentQuestion.answer) {
      setCorrectCount(prev => prev - 1);
    }

    updatedAnswers[questionIndex] = selectedOption;

    if (selectedOption === currentQuestion.answer) {
      setCorrectCount(prev => prev + 1);
    }

    setSelectedAnswers(updatedAnswers);
  };

  // Save marks via API
  const handleMarks = () => {
    const marks = (correctCount / totalQsns) * 100;
    const data = {
      courseId,
      userId,
      marks
    };

    axios.post(`http://localhost:8080/api/assessments/add/${userId}/${courseId}`, data)
      .then(response => {
        console.log('Request successful:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  // Modal controls
  const showModal = () => setOpenModal(true);
  const handleOk = () => setOpenModal(false);
  const handleCancel = () => setOpenModal(false);

  // Result message
  const percentage = (correctCount / totalQsns) * 100;
  let message = '';

  if (percentage >= 80) {
    message = 'Awesome 😎';
  } else if (percentage >= 50) {
    message = 'Good 😊';
  } else {
    message = 'Poor 😒';
  }

  return (
    <div className="assessment-container">

      <div style={{ display: 'flex' }}>
        <button
          type="button"
          id="backbtn"
          className="submit-button"
          onClick={() => navigate(`/course/${courseId}`)}>
          <FontAwesomeIcon icon={faBackward} />
        </button>

        <h1
          className="assessment-title"
          style={{
            backgroundColor: 'darkblue',
            marginLeft: '440px',
            width: '26%',
            color: "white",
            borderRadius: "25px",
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          Assessment Questions
        </h1>
      </div>

      <div className="assessment-form">
        {test.map((question, index) => (
          <div
            key={question.no}
            style={{
              padding: "10px",
              backgroundColor: "rgb(454, 225, 180)",
              marginTop: "10px",
              borderRadius: "18px"
            }}>

            <h3>{question.question}</h3>

            {[question.option1, question.option2, question.option3, question.option4].map((option, optIndex) => (
              <label className="option" key={optIndex}>
                <input
                  type="radio"
                  name={`question_${index}`}    // ✅ fixed here: use index to group options correctly
                  value={option}
                  onChange={() => handleRadioChange(index, option)}
                  style={{ marginLeft: "20px" }}
                  required
                /> {option}
              </label>
            ))}

          </div>
        ))}

        <div style={{ padding: '20px 0 0 0' }}>
          <button
            onClick={() => navigate(0)}
            className="submit-button"
            style={{ marginLeft: "30px", padding: "5px 15px" }}>
            Reset
          </button>

          <button
            onClick={() => { handleMarks(); showModal(); }}
            className="submit-button11">
            Submit
          </button>
        </div>
      </div>

      <Modal
        id="poppup"
        open={openModal}
        onOk={handleOk}
        onCancel={handleCancel}
        style={{ padding: "10px" }}
      >
        <h2 style={{ color: 'darkblue' }}>Assessment Result</h2>
        <h1 style={{ textAlign: "center" }}>{message}</h1>
        <h3 style={{ display: 'flex', justifyContent: 'center' }}>
          You scored {percentage.toFixed(2)} %
        </h3>
      </Modal>
    </div>
  );
}

export default YourComponent;