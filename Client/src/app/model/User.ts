export class User
{
  public userId:number | null;
  public userName:string;
  public userPassword:string;
  public userEmail:string;
  public dob:string;
  public about:string;
  public role:string;


  constructor(userId:any,userName:any,userPassword:any,email:any, dob:any, about:any, role:any)
  {
    this.userId=userId || null;
    this.userName=userName;
    this.userEmail=email;
    this.userPassword=userPassword;
    this.dob=dob;
    this.about=about;
    this.role=role;
  }
}
