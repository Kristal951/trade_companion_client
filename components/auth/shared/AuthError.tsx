import Icon from "@/components/ui/Icon";

const AuthError = ({ message }) => (
  <div className="mb-4 p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20 flex items-center">
    <Icon name="danger" className="w-4 h-4 mr-2" />
    {message}
  </div>
);

export default AuthError;
