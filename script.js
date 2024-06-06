async function readStudentData(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const data = {};
    lines.forEach(line => {
        const [roll_no, branch] = line.split(',');
        data[roll_no] = branch;
    });
    return data;
}

async function readVenueData(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const data = [];
    lines.forEach(line => {
        const [venue, rows, columns] = line.split(',');
        data.push({ venue, rows: parseInt(rows), columns: parseInt(columns) });
    });
    return data;
}

function seatStudents(students, venues) {
    const seatingArrangements = {};
    venues.forEach(venueData => {
        const { venue, rows, columns } = venueData;
        const seats = Array.from({ length: rows }, () => Array(columns).fill(null));
        const remainingStudents = { ...students };

        for (const [roll_no, branch] of Object.entries(remainingStudents)) {
            let placed = false;
            for (let i = 0; i < rows && !placed; i++) {
                for (let j = 0; j < columns && !placed; j++) {
                    if (seats[i][j] === null && (j === 0 || seats[i][j - 1]?.branch !== branch) && (i === 0 || seats[i - 1][j]?.branch !== branch)) {
                        seats[i][j] = { roll_no, branch };
                        delete students[roll_no];
                        placed = true;
                    }
                }
            }
        }
        seatingArrangements[venue] = seats;
    });
    return seatingArrangements;
}

async function generateSeatingArrangement() {
    const semDetails = document.getElementById('sem_details').value;
    const examDetails = document.getElementById('exam_details').value;
    const monthYear = document.getElementById('month_year').value;
    const examDates = document.getElementById('exam_dates').value;
    const examTimings = document.getElementById('exam_timings').value;

    const studentDataFile = document.getElementById('student_data_file').files[0];
    const venueDataFile = document.getElementById('venue_data_file').files[0];

    if (!studentDataFile || !venueDataFile) {
        alert("Please select both student and venue data files.");
        return;
    }

    try {
        const [students, venues] = await Promise.all([readStudentData(studentDataFile), readVenueData(venueDataFile)]);
        const seatingArrangements = seatStudents(students, venues);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape');

        for (const [venue, seats] of Object.entries(seatingArrangements)) {
            pdf.addPage('landscape');

            pdf.setFontSize(16);
            pdf.text("SEAT PLAN", 140, 10, null, null, "center");
            pdf.setFontSize(11);

            pdf.text(`Semester Details: ${semDetails}`, 140, 20, null, null, "center");
            pdf.text(`Examination: ${examDetails} ${monthYear}`, 140, 30, null, null, "center");
            pdf.text(`Date: ${examDates} Time: ${examTimings}`, 140, 40, null, null, "center");
            pdf.text(`VENUE: ${venue}`, 140, 50, null, null, "center");

            const startX = 20;
            const startY = 60;
            const cellWidth = 30;
            const cellHeight = 10;

            seats.forEach((row, rowIndex) => {
                row.forEach((seat, colIndex) => {
                    const x = startX + colIndex * cellWidth;
                    const y = startY + rowIndex * cellHeight;
                    pdf.rect(x, y, cellWidth, cellHeight);
                    const text = seat ? seat.roll_no : "NONE";
                    pdf.text(text, x + cellWidth / 2, y + cellHeight / 2, { align: "center", baseline: "middle" });
                });
            });
        }

        pdf.save("seating_arrangement.pdf");
        alert("Seating arrangement generated successfully.");
    } catch (error) {
        console.error("Error generating seating arrangement:", error);
        alert("Error generating seating arrangement.");
    }
}

function exitApplication() {
    if (confirm("Are you sure you want to exit?")) {
        window.close();
    }
}
