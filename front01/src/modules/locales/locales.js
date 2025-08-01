// prettier-ignore
const locales = {
    //global
    "LOGOUT": "ВЫЙТИ",
    "Navigation": "Меню",
    "Module not available": "Модуль недоступен",
    "username": "имя пользователя",
    "password": "пароль",

    //map editor
    "CLEAR_OFFSET": "СБРОС ВИДА",
    "move_view": "показать",
    "select": "взять",
    "release": "отпустить",
    "copy": "скопировать",
    "delete": "удалить",
    "type": "тип",
    "pos": "координаты",
    "mass": "масса",
    "gr": "грав. колодец",
    "critical_r": "радиус тела",
    "marker_type": "тип маркера",
    "forced": "принудительно",
    "Commit": "Применить",
    "SPAWN": "СОЗДАТЬ",
    "deleter": "удаление",
    "creator": "создание",
    "brush_weight_editor": "изм. веса",
    "obstacles_creator": "созд. преп-ий",
    "obstacles_deleter": "уд. преп-ий",
    "selector": "выделение",
    "cacher": "кэширование",
    "uncacher": "декэширование",
    "radius": "радиус",
    "min_size": "мин. размер",
    "max_size": "макс. размер",
    "min_weight": "мин. вес",
    "max_weight": "макс. вес",
    "closer": "примерно близкие параметры",
    "obstacles_min_count": "мин. кол-во",
    "obstacles_max_count": "макс. кол-во",
    "obstacles_probability": "вероятность",
    "obstacles_type": "тип препятствий",
    "State": "Состояние",
    "on": "вкл.",
    "off": "выкл.",

    //Radar control
    "Radar control": "Сканеры дальнего радиуса действия",
    "distant_arc": "Фокусировка",
    "distant_dir": "Направление",


    //Названия систем
    "engine_sm": "Двигатели",
    "radar_sm": "Сканеры",
    "energy_sm": "Реактор",

    //Energy control
    "Energy control": "Реактор",


    //Engineer
    "assign_team": "Назначить рем.команду",
    "hp": "Целостность",
    "upgrade_level": "Уровень апгрейда",
    "Release_team":"Отправить на отдых",

    //Engine system
    "Acceleration Control": "Управление двигателем",
    "speed": "Скорость",
    "direction": "Курс",
    "deltaV": "дельта-V",

    "prediction_depth": "Прогноз",
    "engine_power": "Мощность",
    "overheat": "Перегрев",

    //InteractionControl
    "InteractionControl": "Управление захватом",

    //roles
    "captain": "Капитан",
    "navigator": "Навигатор",

    //radar
    "toogle_id_labels": "Просмотр идентифкаторов",
    "POS": "Координаты",
    "CURSOR_POS": "Координаты курсора",
    "SCALE": "Масштаб",
    "common_radar":"Общий радар",
    "reset":"сброс",

    //CapPointsController
    "CapPointsController": "Навигационные метки",
    "MarkLetter": "Метка",
    "Position": "Координаты",
    "Status": "Статус",
    "aсtivate": "Поставить",
    "deaсtivate": "Сбросить",
    "is_set": "Установлена",
    "not_set": "Отсутствует",

    //solar_flares
    "time_to_flare": "До начала Вспышки[c]",
    "time_to_next_sf_phase": "До окончания вспышки[c]",
    "sf_probability": "Вероятность вспышки",
    "low":"Низкая",
    "high":"Высокая"
}

export function get_locales(s) {
	if (s in locales) return locales[s];

	return s;
}
