import { contentState } from '../../application/content-state';

export function ContentNotice() {
  return (
    <div className="notice" data-content-status={contentState.status}>
      <strong>Оболочка приложения</strong>
      <p>
        Проверенный контент ещё не подключён. Наличие адреса не подтверждает
        наличие сущности или учебного модуля.
      </p>
    </div>
  );
}
