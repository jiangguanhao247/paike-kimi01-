// 数据层 - 统一存储管理
const STORAGE_KEY = 'schedule_system_v1';

const DataStore = {
  data: null,

  init() {
    this.load();
    if (!this.data) this.data = this.defaultData();
  },

  defaultData() {
    return {
      teachers: [
        { id: 't1', name: '张老师', phone: '13800138001' },
        { id: 't2', name: '李老师', phone: '13800138002' },
        { id: 't3', name: '王老师', phone: '13800138003' },
        { id: 't4', name: '赵老师', phone: '13800138004' },
        { id: 't5', name: '刘老师', phone: '13800138005' },
      ],
      courses: [
      { id: c1, name: '语文', type: 'normal', grades: ['高一', '高二', '高三'] },
      { id: c2, name: '数学', type: 'normal', grades: ['高一', '高二', '高三'] },
      { id: c3, name: '英语', type: 'normal', grades: ['高一', '高二', '高三'] },
      { id: c4, name: '物理', type: 'lab', grades: ['高一', '高二', '高三'] },
      { id: c5, name: '化学', type: 'lab', grades: ['高一', '高二', '高三'] },
      { id: c6, name: '生物', type: 'lab', grades: ['高一', '高二'] },
      { id: c7, name: '历史', type: 'normal', grades: ['高一', '高二', '高三'] },
      { id: c8, name: '地理', type: 'normal', grades: ['高一', '高二'] },
      { id: c9, name: '政治', type: 'normal', grades: ['高一', '高二', '高三'] },
      { id: c10, name: '体育', type: 'normal', grades: ['高一', '高二', '高三'] },
    ],
      classes: [
        { id: 'cl1', name: '高一(1)班', grade: '高一', size: 45 },
        { id: 'cl2', name: '高一(2)班', grade: '高一', size: 42 },
        { id: 'cl3', name: '高一(3)班', grade: '高一', size: 48 },
        { id: 'cl4', name: '高一(4)班', grade: '高一', size: 46 },
      ],
      rooms: [
        { id: 'r1', name: 'A101', capacity: 50, type: 'normal' },
        { id: 'r2', name: 'A102', capacity: 50, type: 'normal' },
        { id: 'r3', name: 'A103', capacity: 50, type: 'normal' },
        { id: 'r4', name: 'B201', capacity: 60, type: 'lab' },
        { id: 'r5', name: 'B202', capacity: 60, type: 'lab' },
      ],
      // 课程安排: courseHours[classId][courseId] = hours
      courseHours: {},
      // 教师安排: teacherAssign[classId][courseId] = teacherId
      teacherAssign: {},
      // 排课结果
      timetable: {},
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.data = JSON.parse(raw);
    } catch (e) { console.error('加载失败', e); }
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  // 教师
  getTeachers() { return this.data.teachers; },
  addTeacher(t) { this.data.teachers.push(t); this.save(); },
  updateTeacher(id, updates) {
    const t = this.data.teachers.find(x => x.id === id);
    if (t) Object.assign(t, updates);
    this.save();
  },
  deleteTeacher(id) {
    this.data.teachers = this.data.teachers.filter(x => x.id !== id);
    this.save();
  },
  deleteTeachers(ids) {
    this.data.teachers = this.data.teachers.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 课程
  getCourses() { return this.data.courses; },
  addCourse(c) { this.data.courses.push(c); this.save(); },
  updateCourse(id, updates) {
    const c = this.data.courses.find(x => x.id === id);
    if (c) Object.assign(c, updates);
    this.save();
  },
  deleteCourse(id) {
    this.data.courses = this.data.courses.filter(x => x.id !== id);
    this.save();
  },
  deleteCourses(ids) {
    this.data.courses = this.data.courses.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 班级
  getClasses() { return this.data.classes; },
  addClass(c) { this.data.classes.push(c); this.save(); },
  updateClass(id, updates) {
    const c = this.data.classes.find(x => x.id === id);
    if (c) Object.assign(c, updates);
    this.save();
  },
  deleteClass(id) {
    this.data.classes = this.data.classes.filter(x => x.id !== id);
    this.save();
  },
  deleteClasses(ids) {
    this.data.classes = this.data.classes.filter(x => !ids.includes(x.id));
    this.save();
  },

  // 教室
  getRooms() { return this.data.rooms; },

  // 课程安排
  getCourseHours(classId, courseId) {
    return this.data.courseHours[classId]?.[courseId] || 0;
  },
  setCourseHours(classId, courseId, hours) {
    if (!this.data.courseHours[classId]) this.data.courseHours[classId] = {};
    this.data.courseHours[classId][courseId] = hours;
    this.save();
  },
  clearCourseHours(classId) {
    delete this.data.courseHours[classId];
    this.save();
  },

  // 教师安排
  getTeacherAssign(classId, courseId) {
    return this.data.teacherAssign[classId]?.[courseId] || '';
  },
  setTeacherAssign(classId, courseId, teacherId) {
    if (!this.data.teacherAssign[classId]) this.data.teacherAssign[classId] = {};
    this.data.teacherAssign[classId][courseId] = teacherId;
    this.save();
  },
  clearTeacherAssign(classId) {
    delete this.data.teacherAssign[classId];
    this.save();
  },

  // 排课
  getTimetable() { return this.data.timetable; },
  setTimetable(t) { this.data.timetable = t; this.save(); },

  // 导出导入
  export() {
    return JSON.stringify(this.data, null, 2);
  },
  import(json) {
    this.data = JSON.parse(json);
    this.save();
  },

  genId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }
};

DataStore.init();
